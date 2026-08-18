import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { TranslationKey } from '../../../core/i18n/catalogs';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AccountWorkspaceRepository } from '../../../core/workspace';
import {
  createTime24,
  type AccessMethod,
  type Breakfast,
  type CheckoutItem,
  type Luggage,
  type NearbyService,
  type NearbyServiceCategory,
  type Parking,
  type Property,
  type PropertyCoverImage,
  type PropertyType,
  type RulePolicy,
  type Time24,
  type TransportType,
} from '../../../domain/property';
import { PropertyImageError, PropertyImageService } from '../../../shared/image';
import { UiIconComponent } from '../../../shared/ui';

export type GuideEditorSection =
  | 'overview'
  | 'arrival-access'
  | 'home-essentials'
  | 'house-rules'
  | 'local-guide'
  | 'extras'
  | 'checkout';

interface SectionDefinition {
  readonly id: GuideEditorSection;
  readonly number: string;
  readonly labelKey: TranslationKey;
}

type ParkingKind = Parking['kind'];
type LuggageKind = Luggage['kind'];
type BreakfastKind = Breakfast['kind'];

interface ServiceControls {
  id: FormControl<string>;
  title: FormControl<string>;
  category: FormControl<NearbyServiceCategory>;
  transportType: FormControl<TransportType | ''>;
  distanceFromProperty: FormControl<string>;
  whyUseful: FormControl<string>;
  lastReviewedAt: FormControl<string | null>;
}

interface CheckoutItemControls {
  id: FormControl<string>;
  label: FormControl<string>;
  isDefault: FormControl<boolean>;
}

const SECTION_ALIASES: Readonly<Record<string, GuideEditorSection>> = {
  arrival: 'arrival-access',
  basics: 'overview',
  checkout: 'checkout',
  extras: 'extras',
  home: 'home-essentials',
  local: 'local-guide',
  overview: 'overview',
  rules: 'house-rules',
  'arrival-access': 'arrival-access',
  'home-essentials': 'home-essentials',
  'house-rules': 'house-rules',
  'local-guide': 'local-guide',
};

const SECTION_DEFINITIONS: readonly SectionDefinition[] = [
  { id: 'overview', number: '01', labelKey: 'editor.basics' },
  { id: 'arrival-access', number: '02', labelKey: 'editor.arrival' },
  { id: 'home-essentials', number: '03', labelKey: 'editor.home' },
  { id: 'house-rules', number: '04', labelKey: 'editor.rules' },
  { id: 'local-guide', number: '05', labelKey: 'editor.localGuide' },
  { id: 'extras', number: '06', labelKey: 'editor.extras' },
  { id: 'checkout', number: '07', labelKey: 'editor.checkout' },
] as const;

const RULE_POLICIES: readonly RulePolicy[] = ['allowed', 'ask-host', 'not-allowed'];
const SERVICE_CATEGORIES: readonly NearbyServiceCategory[] = [
  'cafe',
  'restaurant',
  'supermarket',
  'transport',
  'activity',
];

function createId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid
    ? `${prefix}-${uuid}`
    : `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function splitTime(value: Time24 | null): readonly [string, string] {
  return value === null ? ['', ''] : (value.split(':') as [string, string]);
}

function combineTime(hour: string, minute: string): Time24 | null {
  return hour !== '' && minute !== '' ? createTime24(`${hour}:${minute}`) : null;
}

function serviceContentEquals(left: NearbyService, right: NearbyService): boolean {
  return (
    left.title === right.title &&
    left.category === right.category &&
    left.distanceFromProperty === right.distanceFromProperty &&
    left.whyUseful === right.whyUseful &&
    (left.category !== 'transport' ||
      (right.category === 'transport' && left.transportType === right.transportType))
  );
}

@Component({
  selector: 'app-guide-editor-page',
  imports: [NgTemplateOutlet, ReactiveFormsModule, RouterLink, UiIconComponent],
  templateUrl: './guide-editor.page.html',
  styleUrl: './guide-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuideEditorPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workspaceRepository = inject(AccountWorkspaceRepository);
  private readonly destroyRef = inject(DestroyRef);
  private readonly propertyImages = inject(PropertyImageService);

  readonly i18n = inject(I18nService);
  readonly sectionDefinitions = SECTION_DEFINITIONS;
  readonly rulePolicies = RULE_POLICIES;
  readonly serviceCategories = SERVICE_CATEGORIES;
  readonly hours = Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, '0'));
  readonly minutes = Array.from({ length: 12 }, (_, index) =>
    (index * 5).toString().padStart(2, '0'),
  );
  readonly property = signal<Property | null>(null);
  readonly currentSection = signal<GuideEditorSection>('overview');
  readonly activeServiceIndex = signal<number | null>(null);
  readonly saved = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal(true);
  readonly coverImage = signal<PropertyCoverImage | null>(null);
  readonly imageProcessing = signal(false);
  readonly imageError = signal(false);
  readonly currentStep = computed(
    () => SECTION_DEFINITIONS.findIndex((section) => section.id === this.currentSection()) + 1,
  );
  readonly progressPercentage = computed(() => Math.round((this.currentStep() / 7) * 100));

  readonly overviewForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    cityOrArea: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(300)],
    }),
    propertyType: new FormControl<PropertyType>('apartment', { nonNullable: true }),
    welcomeMessage: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(4_000)],
    }),
    coverAltText: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(240),
    }),
  });

  readonly arrivalForm = new FormGroup({
    checkInHour: new FormControl('', { nonNullable: true, validators: Validators.required }),
    checkInMinute: new FormControl('', { nonNullable: true, validators: Validators.required }),
    checkInInstructions: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
    writtenAddress: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    mapReference: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(2_048),
    }),
    directions: new FormControl('', { nonNullable: true, validators: Validators.maxLength(4_000) }),
    accessMethod: new FormControl<AccessMethod>('door', { nonNullable: true }),
    accessInstructions: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(4_000)],
    }),
    doorCode: new FormControl('', { nonNullable: true, validators: Validators.maxLength(256) }),
    lockboxCode: new FormControl('', { nonNullable: true, validators: Validators.maxLength(256) }),
    parkingKind: new FormControl<ParkingKind>('none', { nonNullable: true }),
    parkingAddress: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(500),
    }),
    parkingInstructions: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
    luggageKind: new FormControl<LuggageKind>('none', { nonNullable: true }),
    luggageProviderName: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(120),
    }),
    luggageAddress: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(500),
    }),
    luggageInstructions: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
  });

  readonly homeForm = new FormGroup({
    hasWifi: new FormControl(false, { nonNullable: true }),
    wifiNetwork: new FormControl('', { nonNullable: true, validators: Validators.maxLength(256) }),
    wifiPassword: new FormControl('', { nonNullable: true, validators: Validators.maxLength(256) }),
    wifiInstructions: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
    heatingAndCooling: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
    hotWater: new FormControl('', { nonNullable: true, validators: Validators.maxLength(4_000) }),
    powerIssues: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
    waste: new FormControl('', { nonNullable: true, validators: Validators.maxLength(4_000) }),
    hostName: new FormControl('', { nonNullable: true, validators: Validators.maxLength(120) }),
    hostPhone: new FormControl('', { nonNullable: true, validators: Validators.maxLength(40) }),
    hostEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(254)],
    }),
  });

  readonly rulesForm = new FormGroup({
    hasQuietHours: new FormControl(false, { nonNullable: true }),
    quietStartHour: new FormControl('', { nonNullable: true }),
    quietStartMinute: new FormControl('', { nonNullable: true }),
    quietEndHour: new FormControl('', { nonNullable: true }),
    quietEndMinute: new FormControl('', { nonNullable: true }),
    smoking: new FormControl<RulePolicy>('not-allowed', { nonNullable: true }),
    events: new FormControl<RulePolicy>('not-allowed', { nonNullable: true }),
    pets: new FormControl<RulePolicy>('ask-host', { nonNullable: true }),
    babies: new FormControl<RulePolicy>('allowed', { nonNullable: true }),
    children: new FormControl<RulePolicy>('allowed', { nonNullable: true }),
    visitors: new FormControl<RulePolicy>('ask-host', { nonNullable: true }),
    additionalNote: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
  });

  readonly localGuideForm = new FormGroup({
    services: new FormArray<FormGroup<ServiceControls>>([]),
  });

  readonly extrasForm = new FormGroup({
    breakfastKind: new FormControl<BreakfastKind>('unavailable', { nonNullable: true }),
    breakfastStartHour: new FormControl('', { nonNullable: true }),
    breakfastStartMinute: new FormControl('', { nonNullable: true }),
    breakfastEndHour: new FormControl('', { nonNullable: true }),
    breakfastEndMinute: new FormControl('', { nonNullable: true }),
    breakfastInstructions: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
    lateCheckoutAvailable: new FormControl(false, { nonNullable: true }),
    lateCheckoutInstructions: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
    familyEquipmentAvailable: new FormControl(false, { nonNullable: true }),
    familyEquipmentInstructions: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
    petStayAvailable: new FormControl(false, { nonNullable: true }),
    petStayInstructions: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
    specialRequests: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
  });

  readonly checkoutForm = new FormGroup({
    checkoutHour: new FormControl('', { nonNullable: true, validators: Validators.required }),
    checkoutMinute: new FormControl('', { nonNullable: true, validators: Validators.required }),
    keyReturn: new FormControl('', { nonNullable: true, validators: Validators.maxLength(4_000) }),
    rubbish: new FormControl('', { nonNullable: true, validators: Validators.maxLength(4_000) }),
    departureNote: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(4_000),
    }),
    checklist: new FormArray<FormGroup<CheckoutItemControls>>([]),
  });

  get services(): FormArray<FormGroup<ServiceControls>> {
    return this.localGuideForm.controls.services;
  }

  get checkoutItems(): FormArray<FormGroup<CheckoutItemControls>> {
    return this.checkoutForm.controls.checklist;
  }

  constructor() {
    this.arrivalForm.controls.parkingKind.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateParkingAddressValidation());
    this.rulesForm.controls.hasQuietHours.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateQuietHoursValidation());
    this.extrasForm.controls.breakfastKind.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateBreakfastTimeValidation());

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((parameters) => {
      const propertyId = parameters.get('propertyId') ?? '';
      const section = SECTION_ALIASES[parameters.get('section') ?? ''] ?? 'overview';
      this.currentSection.set(section);
      this.loadProperty(propertyId);
    });
  }

  sectionIsCurrent(section: GuideEditorSection): boolean {
    return section === this.currentSection();
  }

  categoryLabel(category: NearbyServiceCategory): string {
    const keys: Readonly<Record<NearbyServiceCategory, TranslationKey>> = {
      activity: 'editor.category.activity',
      cafe: 'editor.category.cafe',
      restaurant: 'editor.category.restaurant',
      supermarket: 'editor.category.supermarket',
      transport: 'editor.category.transport',
    };
    return this.i18n.translate(keys[category]);
  }

  policyLabel(policy: RulePolicy): string {
    const keys: Readonly<Record<RulePolicy, TranslationKey>> = {
      allowed: 'editor.allowed',
      'ask-host': 'editor.withApproval',
      'not-allowed': 'editor.notAllowed',
    };
    return this.i18n.translate(keys[policy]);
  }

  navigateToSection(section: GuideEditorSection): void {
    const property = this.property();
    if (property !== null) {
      void this.router.navigate(['/owner/properties', property.id, 'edit', section]);
    }
  }

  addService(): void {
    this.services.push(this.createServiceForm());
    this.activeServiceIndex.set(this.services.length - 1);
  }

  selectService(index: number): void {
    this.activeServiceIndex.set(this.activeServiceIndex() === index ? null : index);
  }

  removeService(index: number): void {
    this.services.removeAt(index);
    const nextIndex = this.services.length === 0 ? null : Math.min(index, this.services.length - 1);
    this.activeServiceIndex.set(nextIndex);
  }

  addCheckoutItem(): void {
    this.checkoutItems.push(
      this.createCheckoutItemForm({
        id: createId('checkout'),
        label: '',
        isDefault: false,
      }),
    );
  }

  async selectCoverImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file || this.imageProcessing()) {
      return;
    }

    this.imageProcessing.set(true);
    this.imageError.set(false);

    try {
      const altText =
        this.overviewForm.controls.coverAltText.value.trim() ||
        this.overviewForm.controls.name.value.trim();
      const image = await this.propertyImages.process(file, altText);
      this.coverImage.set(image);
      this.overviewForm.controls.coverAltText.setValue(image.altText);
    } catch (error) {
      if (error instanceof PropertyImageError) {
        this.imageError.set(true);
      } else {
        this.imageError.set(true);
      }
      input.value = '';
    } finally {
      this.imageProcessing.set(false);
    }
  }

  removeCoverImage(): void {
    this.coverImage.set(null);
    this.overviewForm.controls.coverAltText.setValue('');
    this.imageError.set(false);
  }

  removeCheckoutItem(index: number): void {
    if (!this.checkoutItems.at(index).controls.isDefault.value) {
      this.checkoutItems.removeAt(index);
    }
  }

  saveAndContinue(): void {
    const form = this.currentForm();
    form.markAllAsTouched();

    if (form.invalid || !this.validateTimeRanges()) {
      return;
    }

    const existing = this.property();
    if (existing === null) {
      return;
    }

    const updated = this.applyCurrentSection(existing);
    const saveResult = this.workspaceRepository.upsertProperty(updated);

    if (!saveResult.ok) {
      this.errorMessage.set(this.i18n.translate('error.storage'));
      return;
    }

    this.property.set(updated);
    this.saved.set(true);
    this.errorMessage.set(null);

    const currentIndex = SECTION_DEFINITIONS.findIndex(
      (definition) => definition.id === this.currentSection(),
    );
    const nextSection = SECTION_DEFINITIONS[currentIndex + 1];
    if (nextSection) {
      this.navigateToSection(nextSection.id);
    } else {
      void this.router.navigate(['/owner/properties', updated.id, 'review']);
    }
  }

  goBack(): void {
    const currentIndex = SECTION_DEFINITIONS.findIndex(
      (definition) => definition.id === this.currentSection(),
    );
    const previousSection = SECTION_DEFINITIONS[currentIndex - 1];
    if (previousSection) {
      this.navigateToSection(previousSection.id);
      return;
    }

    void this.router.navigate(['/owner/properties']);
  }

  private loadProperty(propertyId: string): void {
    this.loading.set(true);
    this.saved.set(false);
    const result = this.workspaceRepository.findProperty(propertyId);

    if (!result.ok) {
      this.property.set(null);
      this.errorMessage.set(this.i18n.translate('error.storage'));
      this.loading.set(false);
      return;
    }

    if (result.value === null) {
      this.property.set(null);
      this.errorMessage.set(this.i18n.translate('guest.unavailable.title'));
      this.loading.set(false);
      return;
    }

    this.property.set(result.value);
    this.populateForms(result.value);
    this.errorMessage.set(null);
    this.loading.set(false);
  }

  private populateForms(property: Property): void {
    this.overviewForm.reset({
      name: property.overview.name,
      cityOrArea: property.overview.cityOrArea,
      propertyType: property.overview.propertyType,
      welcomeMessage: property.overview.welcomeMessage,
      coverAltText: property.overview.coverImage?.altText ?? '',
    });
    this.coverImage.set(property.overview.coverImage);

    const [checkInHour, checkInMinute] = splitTime(property.arrivalAccess.checkInTime);
    const parking = property.arrivalAccess.parking;
    const luggage = property.arrivalAccess.luggage;
    this.arrivalForm.reset({
      checkInHour,
      checkInMinute,
      checkInInstructions: property.arrivalAccess.checkInInstructions,
      writtenAddress: property.arrivalAccess.location.writtenAddress,
      mapReference: property.arrivalAccess.location.mapReference,
      directions: property.arrivalAccess.location.directions,
      accessMethod: property.arrivalAccess.homeAccess.method,
      accessInstructions: property.arrivalAccess.homeAccess.instructions,
      doorCode: property.arrivalAccess.homeAccess.doorCode,
      lockboxCode: property.arrivalAccess.homeAccess.lockboxCode,
      parkingKind: parking.kind,
      parkingAddress: parking.kind === 'none' ? '' : parking.address,
      parkingInstructions: parking.kind === 'none' ? '' : parking.instructions,
      luggageKind: luggage.kind,
      luggageProviderName: luggage.kind === 'external-paid' ? luggage.providerName : '',
      luggageAddress: luggage.kind === 'external-paid' ? luggage.address : '',
      luggageInstructions: luggage.kind === 'none' ? '' : luggage.instructions,
    });

    this.homeForm.reset({
      hasWifi: property.homeEssentials.wifi !== null,
      wifiNetwork: property.homeEssentials.wifi?.networkName ?? '',
      wifiPassword: property.homeEssentials.wifi?.password ?? '',
      wifiInstructions: property.homeEssentials.wifi?.instructions ?? '',
      heatingAndCooling: property.homeEssentials.homeCare.heatingAndCooling,
      hotWater: property.homeEssentials.homeCare.hotWater,
      powerIssues: property.homeEssentials.homeCare.powerIssues,
      waste: property.homeEssentials.homeCare.waste,
      hostName: property.hostSupport.name,
      hostPhone: property.hostSupport.phone,
      hostEmail: property.hostSupport.email,
    });

    const quietHours = property.houseRules.quietHours;
    const [quietStartHour, quietStartMinute] = splitTime(quietHours?.startTime ?? null);
    const [quietEndHour, quietEndMinute] = splitTime(quietHours?.endTime ?? null);
    this.rulesForm.reset({
      hasQuietHours: quietHours !== null,
      quietStartHour,
      quietStartMinute,
      quietEndHour,
      quietEndMinute,
      smoking: property.houseRules.smoking,
      events: property.houseRules.events,
      pets: property.houseRules.pets,
      babies: property.houseRules.babies,
      children: property.houseRules.children,
      visitors: property.houseRules.visitors,
      additionalNote: property.houseRules.additionalNote,
    });

    this.services.clear();
    property.localGuide.forEach((service) => this.services.push(this.createServiceForm(service)));
    this.activeServiceIndex.set(property.localGuide.length > 0 ? 0 : null);

    const breakfast = property.extras.breakfast;
    const [breakfastStartHour, breakfastStartMinute] = splitTime(
      breakfast.kind === 'scheduled' ? breakfast.startTime : null,
    );
    const [breakfastEndHour, breakfastEndMinute] = splitTime(
      breakfast.kind === 'scheduled' ? breakfast.endTime : null,
    );
    this.extrasForm.reset({
      breakfastKind: breakfast.kind,
      breakfastStartHour,
      breakfastStartMinute,
      breakfastEndHour,
      breakfastEndMinute,
      breakfastInstructions: breakfast.kind === 'unavailable' ? '' : breakfast.instructions,
      lateCheckoutAvailable: property.extras.lateCheckout.available,
      lateCheckoutInstructions: property.extras.lateCheckout.instructions,
      familyEquipmentAvailable: property.extras.familyEquipment.available,
      familyEquipmentInstructions: property.extras.familyEquipment.instructions,
      petStayAvailable: property.extras.petStay.available,
      petStayInstructions: property.extras.petStay.instructions,
      specialRequests: property.extras.specialRequests,
    });

    const [checkoutHour, checkoutMinute] = splitTime(property.checkout.checkoutTime);
    this.checkoutForm.patchValue({
      checkoutHour,
      checkoutMinute,
      keyReturn: property.checkout.keyReturn,
      rubbish: property.checkout.rubbish,
      departureNote: property.checkout.departureNote,
    });
    this.checkoutItems.clear();
    property.checkout.checklist.forEach((item) =>
      this.checkoutItems.push(this.createCheckoutItemForm(item)),
    );

    this.updateParkingAddressValidation();
    this.updateQuietHoursValidation();
    this.updateBreakfastTimeValidation();
  }

  private createServiceForm(service?: NearbyService): FormGroup<ServiceControls> {
    const form = new FormGroup<ServiceControls>({
      id: new FormControl(service?.id ?? createId('service'), { nonNullable: true }),
      title: new FormControl(service?.title ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(120)],
      }),
      category: new FormControl<NearbyServiceCategory>(service?.category ?? 'cafe', {
        nonNullable: true,
      }),
      transportType: new FormControl<TransportType | ''>(
        service?.category === 'transport' ? service.transportType : '',
        { nonNullable: true },
      ),
      distanceFromProperty: new FormControl(service?.distanceFromProperty ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(300)],
      }),
      whyUseful: new FormControl(service?.whyUseful ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(4_000)],
      }),
      lastReviewedAt: new FormControl<string | null>(service?.lastReviewedAt ?? null),
    });

    form.controls.category.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateTransportTypeValidation(form));
    this.updateTransportTypeValidation(form);
    return form;
  }

  private createCheckoutItemForm(item: CheckoutItem): FormGroup<CheckoutItemControls> {
    return new FormGroup<CheckoutItemControls>({
      id: new FormControl(item.id, { nonNullable: true }),
      label: new FormControl(item.label, {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(300)],
      }),
      isDefault: new FormControl(item.isDefault, { nonNullable: true }),
    });
  }

  private updateParkingAddressValidation(): void {
    const control = this.arrivalForm.controls.parkingAddress;
    control.setValidators(
      this.arrivalForm.controls.parkingKind.value === 'none'
        ? Validators.maxLength(500)
        : [Validators.required, Validators.maxLength(500)],
    );
    control.updateValueAndValidity({ emitEvent: false });
  }

  private updateQuietHoursValidation(): void {
    const validators = this.rulesForm.controls.hasQuietHours.value ? [Validators.required] : [];
    for (const control of [
      this.rulesForm.controls.quietStartHour,
      this.rulesForm.controls.quietStartMinute,
      this.rulesForm.controls.quietEndHour,
      this.rulesForm.controls.quietEndMinute,
    ]) {
      control.setValidators(validators);
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private updateBreakfastTimeValidation(): void {
    const validators =
      this.extrasForm.controls.breakfastKind.value === 'scheduled' ? [Validators.required] : [];
    for (const control of [
      this.extrasForm.controls.breakfastStartHour,
      this.extrasForm.controls.breakfastStartMinute,
      this.extrasForm.controls.breakfastEndHour,
      this.extrasForm.controls.breakfastEndMinute,
    ]) {
      control.setValidators(validators);
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private updateTransportTypeValidation(form: FormGroup<ServiceControls>): void {
    form.controls.transportType.setValidators(
      form.controls.category.value === 'transport' ? Validators.required : [],
    );
    if (form.controls.category.value !== 'transport') {
      form.controls.transportType.setValue('', { emitEvent: false });
    }
    form.controls.transportType.updateValueAndValidity({ emitEvent: false });
  }

  private validateTimeRanges(): boolean {
    if (this.currentSection() === 'house-rules' && this.rulesForm.controls.hasQuietHours.value) {
      const start = combineTime(
        this.rulesForm.controls.quietStartHour.value,
        this.rulesForm.controls.quietStartMinute.value,
      );
      const end = combineTime(
        this.rulesForm.controls.quietEndHour.value,
        this.rulesForm.controls.quietEndMinute.value,
      );
      if (start === end) {
        this.rulesForm.controls.quietEndHour.setErrors({ identicalTime: true });
        return false;
      }
    }

    if (
      this.currentSection() === 'extras' &&
      this.extrasForm.controls.breakfastKind.value === 'scheduled'
    ) {
      const start = combineTime(
        this.extrasForm.controls.breakfastStartHour.value,
        this.extrasForm.controls.breakfastStartMinute.value,
      );
      const end = combineTime(
        this.extrasForm.controls.breakfastEndHour.value,
        this.extrasForm.controls.breakfastEndMinute.value,
      );
      if (start === null || end === null || start >= end) {
        this.extrasForm.controls.breakfastEndHour.setErrors({ invalidRange: true });
        return false;
      }
    }

    return true;
  }

  private currentForm(): FormGroup {
    switch (this.currentSection()) {
      case 'overview':
        return this.overviewForm;
      case 'arrival-access':
        return this.arrivalForm;
      case 'home-essentials':
        return this.homeForm;
      case 'house-rules':
        return this.rulesForm;
      case 'local-guide':
        return this.localGuideForm;
      case 'extras':
        return this.extrasForm;
      case 'checkout':
        return this.checkoutForm;
    }
  }

  private applyCurrentSection(property: Property): Property {
    const updatedAt = new Date().toISOString();
    let updated: Property;

    switch (this.currentSection()) {
      case 'overview': {
        const value = this.overviewForm.getRawValue();
        updated = {
          ...property,
          overview: {
            name: value.name,
            cityOrArea: value.cityOrArea,
            propertyType: value.propertyType,
            welcomeMessage: value.welcomeMessage,
            coverImage: this.coverImage()
              ? { ...this.coverImage()!, altText: value.coverAltText.trim() }
              : null,
          },
        };
        break;
      }
      case 'arrival-access': {
        const value = this.arrivalForm.getRawValue();
        updated = {
          ...property,
          arrivalAccess: {
            checkInTime: combineTime(value.checkInHour, value.checkInMinute),
            checkInInstructions: value.checkInInstructions,
            location: {
              writtenAddress: value.writtenAddress,
              mapReference: value.mapReference,
              directions: value.directions,
            },
            homeAccess: {
              method: value.accessMethod,
              instructions: value.accessInstructions,
              doorCode: value.doorCode,
              lockboxCode: value.lockboxCode,
            },
            parking: this.buildParking(value),
            luggage: this.buildLuggage(value),
          },
        };
        break;
      }
      case 'home-essentials': {
        const value = this.homeForm.getRawValue();
        updated = {
          ...property,
          homeEssentials: {
            wifi: value.hasWifi
              ? {
                  networkName: value.wifiNetwork,
                  password: value.wifiPassword,
                  instructions: value.wifiInstructions,
                }
              : null,
            homeCare: {
              heatingAndCooling: value.heatingAndCooling,
              hotWater: value.hotWater,
              powerIssues: value.powerIssues,
              waste: value.waste,
            },
          },
          hostSupport: {
            ...property.hostSupport,
            name: value.hostName,
            phone: value.hostPhone,
            email: value.hostEmail,
          },
        };
        break;
      }
      case 'house-rules': {
        const value = this.rulesForm.getRawValue();
        updated = {
          ...property,
          houseRules: {
            quietHours: value.hasQuietHours
              ? {
                  startTime: combineTime(value.quietStartHour, value.quietStartMinute),
                  endTime: combineTime(value.quietEndHour, value.quietEndMinute),
                }
              : null,
            smoking: value.smoking,
            events: value.events,
            pets: value.pets,
            babies: value.babies,
            children: value.children,
            visitors: value.visitors,
            additionalNote: value.additionalNote,
          },
        };
        break;
      }
      case 'local-guide': {
        const now = updatedAt;
        const services = this.services.controls.map((form): NearbyService => {
          const value = form.getRawValue();
          const base = {
            id: value.id,
            title: value.title,
            distanceFromProperty: value.distanceFromProperty,
            whyUseful: value.whyUseful,
            lastReviewedAt: value.lastReviewedAt,
          };
          const candidate: NearbyService =
            value.category === 'transport'
              ? {
                  ...base,
                  category: 'transport',
                  transportType: value.transportType as TransportType,
                }
              : { ...base, category: value.category };
          const previous = property.localGuide.find((service) => service.id === candidate.id);
          return {
            ...candidate,
            lastReviewedAt:
              previous && serviceContentEquals(previous, candidate) ? previous.lastReviewedAt : now,
          };
        });
        updated = { ...property, localGuide: services };
        break;
      }
      case 'extras': {
        const value = this.extrasForm.getRawValue();
        updated = {
          ...property,
          extras: {
            breakfast: this.buildBreakfast(value),
            lateCheckout: {
              available: value.lateCheckoutAvailable,
              instructions: value.lateCheckoutInstructions,
            },
            familyEquipment: {
              available: value.familyEquipmentAvailable,
              instructions: value.familyEquipmentInstructions,
            },
            petStay: {
              available: value.petStayAvailable,
              instructions: value.petStayInstructions,
            },
            specialRequests: value.specialRequests,
          },
        };
        break;
      }
      case 'checkout': {
        const value = this.checkoutForm.getRawValue();
        updated = {
          ...property,
          checkout: {
            checkoutTime: combineTime(value.checkoutHour, value.checkoutMinute),
            keyReturn: value.keyReturn,
            rubbish: value.rubbish,
            departureNote: value.departureNote,
            checklist: value.checklist,
          },
        };
        break;
      }
    }

    return { ...updated, metadata: { ...updated.metadata, updatedAt } };
  }

  private buildParking(value: ReturnType<typeof this.arrivalForm.getRawValue>): Parking {
    return value.parkingKind === 'none'
      ? { kind: 'none' }
      : {
          kind: value.parkingKind,
          address: value.parkingAddress,
          instructions: value.parkingInstructions,
        };
  }

  private buildLuggage(value: ReturnType<typeof this.arrivalForm.getRawValue>): Luggage {
    if (value.luggageKind === 'none') {
      return { kind: 'none' };
    }

    if (value.luggageKind === 'internal') {
      return { kind: 'internal', instructions: value.luggageInstructions };
    }

    return {
      kind: 'external-paid',
      providerName: value.luggageProviderName,
      address: value.luggageAddress,
      instructions: value.luggageInstructions,
    };
  }

  private buildBreakfast(value: ReturnType<typeof this.extrasForm.getRawValue>): Breakfast {
    if (value.breakfastKind === 'unavailable') {
      return { kind: 'unavailable' };
    }

    if (value.breakfastKind === 'on-request') {
      return { kind: 'on-request', instructions: value.breakfastInstructions };
    }

    return {
      kind: 'scheduled',
      startTime: combineTime(value.breakfastStartHour, value.breakfastStartMinute),
      endTime: combineTime(value.breakfastEndHour, value.breakfastEndMinute),
      instructions: value.breakfastInstructions,
    };
  }
}
