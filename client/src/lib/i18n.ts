import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: "Dashboard",
      banned_guests: "Banned Guests",
      guestlists: "Guestlists",
      id_scanning: "ID Scanning",
      clubs: "Clubs",
      users: "Users",
      chat: "Chat",
      settings: "Settings",
      plugins: "Plugins",
      help: "Help & Support",

      // Dashboard
      total_clubs: "Total Clubs",
      active_bans: "Active Bans",
      guestlist_entries: "Guestlist Entries",
      id_scans: "ID Scans",
      this_month: "this month",
      this_week: "this week",
      today: "today",
      recent_bans: "Recent Bans",
      quick_actions: "Quick Actions",
      active_guestlists: "Active Guestlists",
      recent_activity: "Recent Activity",

      // Common
      name: "Name",
      club: "Club",
      status: "Status",
      date: "Date",
      actions: "Actions",
      guests: "guests",
      view_all: "View All",
      notifications: "Notifications",

      // Quick Actions
      add_ban: "Add Ban",
      create_guestlist: "Create Guestlist",
      add_club: "Add Club",
      manage_users: "Manage Users",
      scan_id: "Scan ID",

      // Auth
      login: "Login",
      register: "Register",
      username: "Username",
      password: "Password",
      email: "Email",
      full_name: "Full Name",
      phone: "Phone",
      sign_in: "Sign In",
      sign_up: "Sign Up",
      welcome_back: "Welcome back",
      enter_credentials: "Enter your credentials to access XESS",
      create_account: "Create your account",
      join_platform: "Join the XESS platform today",

      // Errors
      required_field: "This field is required",
      invalid_email: "Please enter a valid email address",
      password_min_length: "Password must be at least 6 characters",
    }
  },
  de: {
    translation: {
      // Navigation
      dashboard: "Dashboard",
      banned_guests: "Gesperrte Gäste",
      guestlists: "Gästelisten",
      id_scanning: "ID-Scanning",
      clubs: "Clubs",
      users: "Benutzer",
      chat: "Chat",
      settings: "Einstellungen",
      plugins: "Plugins",
      help: "Hilfe & Support",

      // Dashboard
      total_clubs: "Clubs Gesamt",
      active_bans: "Aktive Sperren",
      guestlist_entries: "Gästelisten-Einträge",
      id_scans: "ID-Scans",
      this_month: "diesen Monat",
      this_week: "diese Woche",
      today: "heute",
      recent_bans: "Neueste Sperren",
      quick_actions: "Schnellaktionen",
      active_guestlists: "Aktive Gästelisten",
      recent_activity: "Neueste Aktivität",

      // Common
      name: "Name",
      club: "Club",
      status: "Status",
      date: "Datum",
      actions: "Aktionen",
      guests: "Gäste",
      view_all: "Alle anzeigen",
      notifications: "Benachrichtigungen",

      // Quick Actions
      add_ban: "Sperre hinzufügen",
      create_guestlist: "Gästeliste erstellen",
      add_club: "Club hinzufügen",
      manage_users: "Benutzer verwalten",
      scan_id: "ID scannen",

      // Auth
      login: "Anmelden",
      register: "Registrieren",
      username: "Benutzername",
      password: "Passwort",
      email: "E-Mail",
      full_name: "Vollständiger Name",
      phone: "Telefon",
      sign_in: "Anmelden",
      sign_up: "Registrieren",
      welcome_back: "Willkommen zurück",
      enter_credentials: "Geben Sie Ihre Anmeldedaten ein, um auf XESS zuzugreifen",
      create_account: "Konto erstellen",
      join_platform: "Treten Sie noch heute der XESS-Plattform bei",

      // Errors
      required_field: "Dieses Feld ist erforderlich",
      invalid_email: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
      password_min_length: "Das Passwort muss mindestens 6 Zeichen lang sein",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
