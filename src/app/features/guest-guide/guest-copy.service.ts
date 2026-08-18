import { inject, Injectable } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import type { SupportedLocale } from '../../core/i18n/locale';

export type GuestCopyKey =
  | 'accessMethod'
  | 'accessMethod.door'
  | 'accessMethod.lockbox'
  | 'accessMethod.meetHost'
  | 'accessMethod.other'
  | 'address'
  | 'allowed'
  | 'askHost'
  | 'babies'
  | 'breakfast'
  | 'breakfast.onRequest'
  | 'breakfast.scheduled'
  | 'breakfast.unavailable'
  | 'checkInTime'
  | 'checkoutTime'
  | 'children'
  | 'category.activity'
  | 'category.cafe'
  | 'category.restaurant'
  | 'category.supermarket'
  | 'category.transport'
  | 'directions'
  | 'distance'
  | 'doorCode'
  | 'events'
  | 'familyEquipment'
  | 'heatingAndCooling'
  | 'hostPhoto'
  | 'hotWater'
  | 'internetHelp'
  | 'internetIntro'
  | 'internetSupport'
  | 'instructions'
  | 'keyReturn'
  | 'lateCheckout'
  | 'lockboxCode'
  | 'luggage.externalPaid'
  | 'luggage.internal'
  | 'luggage.none'
  | 'mapPreview'
  | 'networkName'
  | 'notAllowed'
  | 'parking.askHost'
  | 'parking.nearbyFree'
  | 'parking.nearbyPaid'
  | 'parking.none'
  | 'parking.onSite'
  | 'password'
  | 'pets'
  | 'petStay'
  | 'powerIssues'
  | 'provider'
  | 'quietHours'
  | 'recommendation'
  | 'rubbish'
  | 'smoking'
  | 'specialRequests'
  | 'transport.public'
  | 'transport.taxi'
  | 'visitors'
  | 'waste'
  | 'wifiInstructions'
  | 'whyUseful'
  | 'yourStayGuide';

type GuestCopyCatalog = Readonly<Record<GuestCopyKey, string>>;

const english: GuestCopyCatalog = {
  accessMethod: 'Access method',
  'accessMethod.door': 'Door entry',
  'accessMethod.lockbox': 'Lockbox',
  'accessMethod.meetHost': 'Meet your host',
  'accessMethod.other': 'Other access method',
  address: 'Address',
  allowed: 'Allowed',
  askHost: 'Ask your host',
  babies: 'Babies',
  breakfast: 'Breakfast',
  'breakfast.onRequest': 'Available on request',
  'breakfast.scheduled': 'Available at specific hours',
  'breakfast.unavailable': 'Not available',
  checkInTime: 'Check-in time',
  checkoutTime: 'Check-out time',
  children: 'Children',
  'category.activity': 'Activity',
  'category.cafe': 'Café',
  'category.restaurant': 'Restaurant',
  'category.supermarket': 'Supermarket',
  'category.transport': 'Transport',
  directions: 'Directions',
  distance: 'Distance from the property',
  doorCode: 'Door code',
  events: 'Events',
  familyEquipment: 'Family equipment',
  heatingAndCooling: 'Heating and cooling',
  hostPhoto: 'Host profile photo',
  hotWater: 'Hot water',
  internetHelp: 'Need help with internet?',
  internetIntro: 'Connect to the property Wi-Fi with the details provided by your host.',
  internetSupport: 'Your host can provide the current connection details.',
  instructions: 'Instructions',
  keyReturn: 'Key return',
  lateCheckout: 'Late check-out',
  lockboxCode: 'Lockbox code',
  'luggage.externalPaid': 'Paid luggage lockers nearby',
  'luggage.internal': 'Luggage storage at the property',
  'luggage.none': 'No luggage storage is available',
  mapPreview: 'Map preview',
  networkName: 'Wi-Fi network',
  notAllowed: 'Not allowed',
  'parking.askHost': 'Ask your host about parking',
  'parking.nearbyFree': 'Free parking nearby',
  'parking.nearbyPaid': 'Paid parking nearby',
  'parking.none': 'No parking is available',
  'parking.onSite': 'Parking at the property',
  password: 'Password',
  pets: 'Pets',
  petStay: 'Pet stay',
  powerIssues: 'Power issues',
  provider: 'Provider',
  quietHours: 'Quiet hours',
  recommendation: 'Local recommendation',
  rubbish: 'Rubbish',
  smoking: 'Smoking',
  specialRequests: 'Special requests',
  'transport.public': 'Public transport',
  'transport.taxi': 'Taxi',
  visitors: 'Visitors',
  waste: 'Waste and recycling',
  wifiInstructions: 'Connection instructions',
  whyUseful: 'Why it is useful',
  yourStayGuide: 'Your stay guide',
};

const spanish: GuestCopyCatalog = {
  accessMethod: 'Método de acceso',
  'accessMethod.door': 'Entrada por la puerta',
  'accessMethod.lockbox': 'Caja de llaves',
  'accessMethod.meetHost': 'Encuentro con el anfitrión',
  'accessMethod.other': 'Otro método de acceso',
  address: 'Dirección',
  allowed: 'Permitido',
  askHost: 'Consulta al anfitrión',
  babies: 'Bebés',
  breakfast: 'Desayuno',
  'breakfast.onRequest': 'Disponible bajo petición',
  'breakfast.scheduled': 'Disponible en un horario concreto',
  'breakfast.unavailable': 'No disponible',
  checkInTime: 'Hora de llegada',
  checkoutTime: 'Hora de salida',
  children: 'Niños',
  'category.activity': 'Actividad',
  'category.cafe': 'Cafetería',
  'category.restaurant': 'Restaurante',
  'category.supermarket': 'Supermercado',
  'category.transport': 'Transporte',
  directions: 'Indicaciones',
  distance: 'Distancia desde el alojamiento',
  doorCode: 'Código de la puerta',
  events: 'Eventos',
  familyEquipment: 'Equipamiento familiar',
  heatingAndCooling: 'Calefacción y aire acondicionado',
  hostPhoto: 'Foto de perfil del anfitrión',
  hotWater: 'Agua caliente',
  internetHelp: '¿Necesitas ayuda con internet?',
  internetIntro: 'Conéctate al Wi-Fi del alojamiento con los datos que te comparte tu anfitrión.',
  internetSupport: 'Tu anfitrión puede facilitarte los datos de conexión actualizados.',
  instructions: 'Instrucciones',
  keyReturn: 'Devolución de llaves',
  lateCheckout: 'Salida tardía',
  lockboxCode: 'Código de la caja de llaves',
  'luggage.externalPaid': 'Taquillas de pago cercanas',
  'luggage.internal': 'Guardaequipaje en el alojamiento',
  'luggage.none': 'No hay guardaequipaje disponible',
  mapPreview: 'Vista del mapa',
  networkName: 'Red Wi-Fi',
  notAllowed: 'No permitido',
  'parking.askHost': 'Consulta al anfitrión sobre el aparcamiento',
  'parking.nearbyFree': 'Aparcamiento gratuito cercano',
  'parking.nearbyPaid': 'Aparcamiento de pago cercano',
  'parking.none': 'No hay aparcamiento disponible',
  'parking.onSite': 'Aparcamiento en el alojamiento',
  password: 'Contraseña',
  pets: 'Mascotas',
  petStay: 'Estancia con mascotas',
  powerIssues: 'Problemas eléctricos',
  provider: 'Proveedor',
  quietHours: 'Horario de silencio',
  recommendation: 'Recomendación local',
  rubbish: 'Basura',
  smoking: 'Fumar',
  specialRequests: 'Peticiones especiales',
  'transport.public': 'Transporte público',
  'transport.taxi': 'Taxi',
  visitors: 'Visitas',
  waste: 'Residuos y reciclaje',
  wifiInstructions: 'Instrucciones de conexión',
  whyUseful: 'Por qué es útil',
  yourStayGuide: 'Tu guía de estancia',
};

const french: GuestCopyCatalog = {
  accessMethod: "Mode d'accès",
  'accessMethod.door': 'Entrée par la porte',
  'accessMethod.lockbox': 'Boîte à clés',
  'accessMethod.meetHost': "Rencontrer l'hôte",
  'accessMethod.other': "Autre mode d'accès",
  address: 'Adresse',
  allowed: 'Autorisé',
  askHost: "Demander à l'hôte",
  babies: 'Bébés',
  breakfast: 'Petit-déjeuner',
  'breakfast.onRequest': 'Disponible sur demande',
  'breakfast.scheduled': 'Disponible à des horaires précis',
  'breakfast.unavailable': 'Non disponible',
  checkInTime: "Heure d'arrivée",
  checkoutTime: 'Heure de départ',
  children: 'Enfants',
  'category.activity': 'Activité',
  'category.cafe': 'Café',
  'category.restaurant': 'Restaurant',
  'category.supermarket': 'Supermarché',
  'category.transport': 'Transports',
  directions: 'Itinéraire',
  distance: 'Distance depuis le logement',
  doorCode: 'Code de la porte',
  events: 'Événements',
  familyEquipment: 'Équipement familial',
  heatingAndCooling: 'Chauffage et climatisation',
  hostPhoto: "Photo de profil de l'hôte",
  hotWater: 'Eau chaude',
  internetHelp: "Besoin d'aide avec Internet ?",
  internetIntro: "Connectez-vous au Wi-Fi du logement avec les informations fournies par votre hôte.",
  internetSupport: "Votre hôte peut vous fournir les informations de connexion à jour.",
  instructions: 'Instructions',
  keyReturn: 'Retour des clés',
  lateCheckout: 'Départ tardif',
  lockboxCode: 'Code de la boîte à clés',
  'luggage.externalPaid': 'Consignes à bagages payantes à proximité',
  'luggage.internal': 'Bagagerie dans le logement',
  'luggage.none': "Aucune bagagerie n'est disponible",
  mapPreview: 'Aperçu de la carte',
  networkName: 'Réseau Wi-Fi',
  notAllowed: 'Non autorisé',
  'parking.askHost': "Demander à l'hôte pour le stationnement",
  'parking.nearbyFree': 'Stationnement gratuit à proximité',
  'parking.nearbyPaid': 'Stationnement payant à proximité',
  'parking.none': "Aucun stationnement n'est disponible",
  'parking.onSite': 'Stationnement dans le logement',
  password: 'Mot de passe',
  pets: 'Animaux',
  petStay: 'Séjour avec un animal',
  powerIssues: "Problèmes d'électricité",
  provider: 'Prestataire',
  quietHours: 'Heures de calme',
  recommendation: 'Recommandation locale',
  rubbish: 'Déchets',
  smoking: 'Fumer',
  specialRequests: 'Demandes particulières',
  'transport.public': 'Transports en commun',
  'transport.taxi': 'Taxi',
  visitors: 'Visiteurs',
  waste: 'Déchets et recyclage',
  wifiInstructions: 'Instructions de connexion',
  whyUseful: 'Pourquoi cette adresse est utile',
  yourStayGuide: 'Votre guide de séjour',
};

const german: GuestCopyCatalog = {
  accessMethod: 'Zugangsmethode',
  'accessMethod.door': 'Zugang durch die Tür',
  'accessMethod.lockbox': 'Schlüsselkasten',
  'accessMethod.meetHost': 'Gastgeber treffen',
  'accessMethod.other': 'Andere Zugangsmethode',
  address: 'Adresse',
  allowed: 'Erlaubt',
  askHost: 'Gastgeber fragen',
  babies: 'Babys',
  breakfast: 'Frühstück',
  'breakfast.onRequest': 'Auf Anfrage verfügbar',
  'breakfast.scheduled': 'Zu bestimmten Zeiten verfügbar',
  'breakfast.unavailable': 'Nicht verfügbar',
  checkInTime: 'Check-in-Zeit',
  checkoutTime: 'Check-out-Zeit',
  children: 'Kinder',
  'category.activity': 'Aktivität',
  'category.cafe': 'Café',
  'category.restaurant': 'Restaurant',
  'category.supermarket': 'Supermarkt',
  'category.transport': 'Verkehrsmittel',
  directions: 'Wegbeschreibung',
  distance: 'Entfernung von der Unterkunft',
  doorCode: 'Türcode',
  events: 'Veranstaltungen',
  familyEquipment: 'Familienausstattung',
  heatingAndCooling: 'Heizung und Klimaanlage',
  hostPhoto: 'Profilfoto des Gastgebers',
  hotWater: 'Warmwasser',
  internetHelp: 'Brauchst du Hilfe mit dem Internet?',
  internetIntro: 'Verbinde dich mit dem WLAN der Unterkunft mit den Angaben deines Gastgebers.',
  internetSupport: 'Dein Gastgeber kann dir die aktuellen Verbindungsdaten geben.',
  instructions: 'Anweisungen',
  keyReturn: 'Schlüsselrückgabe',
  lateCheckout: 'Später Check-out',
  lockboxCode: 'Code des Schlüsselkastens',
  'luggage.externalPaid': 'Kostenpflichtige Gepäckschließfächer in der Nähe',
  'luggage.internal': 'Gepäckaufbewahrung in der Unterkunft',
  'luggage.none': 'Keine Gepäckaufbewahrung verfügbar',
  mapPreview: 'Kartenvorschau',
  networkName: 'WLAN-Netzwerk',
  notAllowed: 'Nicht erlaubt',
  'parking.askHost': 'Gastgeber nach Parkmöglichkeiten fragen',
  'parking.nearbyFree': 'Kostenlose Parkplätze in der Nähe',
  'parking.nearbyPaid': 'Kostenpflichtige Parkplätze in der Nähe',
  'parking.none': 'Keine Parkmöglichkeit verfügbar',
  'parking.onSite': 'Parkplatz an der Unterkunft',
  password: 'Passwort',
  pets: 'Haustiere',
  petStay: 'Aufenthalt mit Haustier',
  powerIssues: 'Stromprobleme',
  provider: 'Anbieter',
  quietHours: 'Ruhezeiten',
  recommendation: 'Lokale Empfehlung',
  rubbish: 'Abfall',
  smoking: 'Rauchen',
  specialRequests: 'Besondere Wünsche',
  'transport.public': 'Öffentlicher Verkehr',
  'transport.taxi': 'Taxi',
  visitors: 'Besucher',
  waste: 'Abfall und Recycling',
  wifiInstructions: 'Verbindungsanweisungen',
  whyUseful: 'Warum diese Empfehlung hilfreich ist',
  yourStayGuide: 'Ihr Aufenthaltsguide',
};

const catalogs: Readonly<Record<SupportedLocale, GuestCopyCatalog>> = {
  'en-GB': english,
  'es-ES': spanish,
  'fr-FR': french,
  'de-DE': german,
};

@Injectable({ providedIn: 'root' })
export class GuestCopyService {
  private readonly i18n = inject(I18nService);

  text(key: GuestCopyKey): string {
    return catalogs[this.i18n.locale()][key];
  }
}
