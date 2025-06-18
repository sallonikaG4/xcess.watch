--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ban_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.ban_status AS ENUM (
    'banned_sl',
    'banned_lr',
    'revoked',
    'reinstated'
);


ALTER TYPE public.ban_status OWNER TO neondb_owner;

--
-- Name: guest_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.guest_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'checked_in',
    'no_show',
    'revoked'
);


ALTER TYPE public.guest_status OWNER TO neondb_owner;

--
-- Name: license_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.license_status AS ENUM (
    'active',
    'inactive',
    'expired',
    'suspended'
);


ALTER TYPE public.license_status OWNER TO neondb_owner;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'admin',
    'club_manager',
    'security_teamleader',
    'security_personnel',
    'club_employee'
);


ALTER TYPE public.user_role OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    action text NOT NULL,
    description text NOT NULL,
    user_id integer NOT NULL,
    club_id integer,
    metadata text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO neondb_owner;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO neondb_owner;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: banned_guests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.banned_guests (
    id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth text,
    nationality text,
    id_number text,
    id_type text,
    photo_front text,
    photo_back text,
    ban_reason text NOT NULL,
    police_incident_number text,
    incident_date text,
    incident_description text,
    status public.ban_status DEFAULT 'banned_sl'::public.ban_status NOT NULL,
    club_id integer NOT NULL,
    banned_by integer NOT NULL,
    revoked_by integer,
    revocation_reason text,
    revoked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.banned_guests OWNER TO neondb_owner;

--
-- Name: banned_guests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.banned_guests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.banned_guests_id_seq OWNER TO neondb_owner;

--
-- Name: banned_guests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.banned_guests_id_seq OWNED BY public.banned_guests.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    message text NOT NULL,
    from_user_id integer NOT NULL,
    to_user_id integer,
    club_id integer,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_messages OWNER TO neondb_owner;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO neondb_owner;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: clubs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clubs (
    id integer NOT NULL,
    name text NOT NULL,
    address text,
    city text,
    country text,
    license_key text NOT NULL,
    license_status public.license_status DEFAULT 'active'::public.license_status NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    smtp_settings text,
    sms_settings text,
    security_company_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clubs OWNER TO neondb_owner;

--
-- Name: clubs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.clubs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clubs_id_seq OWNER TO neondb_owner;

--
-- Name: clubs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.clubs_id_seq OWNED BY public.clubs.id;


--
-- Name: guestlist_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.guestlist_entries (
    id integer NOT NULL,
    guestlist_id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    guest_count integer DEFAULT 1 NOT NULL,
    comments text,
    status public.guest_status DEFAULT 'pending'::public.guest_status NOT NULL,
    checked_in_at timestamp without time zone,
    checked_in_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.guestlist_entries OWNER TO neondb_owner;

--
-- Name: guestlist_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.guestlist_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guestlist_entries_id_seq OWNER TO neondb_owner;

--
-- Name: guestlist_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.guestlist_entries_id_seq OWNED BY public.guestlist_entries.id;


--
-- Name: guestlists; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.guestlists (
    id integer NOT NULL,
    name text NOT NULL,
    event_date timestamp without time zone NOT NULL,
    event_time text,
    description text,
    max_guests integer,
    is_active boolean DEFAULT true NOT NULL,
    club_id integer NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    bookmetender_event_id text,
    bookmetender_api_key text,
    bookmetender_sync_enabled boolean DEFAULT false,
    last_bookmetender_sync timestamp without time zone
);


ALTER TABLE public.guestlists OWNER TO neondb_owner;

--
-- Name: guestlists_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.guestlists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guestlists_id_seq OWNER TO neondb_owner;

--
-- Name: guestlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.guestlists_id_seq OWNED BY public.guestlists.id;


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.licenses (
    id integer NOT NULL,
    organization text NOT NULL,
    license_key text NOT NULL,
    license_type text NOT NULL,
    max_clubs integer NOT NULL,
    max_users integer NOT NULL,
    expiration_date text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    features text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.licenses OWNER TO neondb_owner;

--
-- Name: licenses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.licenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.licenses_id_seq OWNER TO neondb_owner;

--
-- Name: licenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.licenses_id_seq OWNED BY public.licenses.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    target_role public.user_role,
    target_user_id integer,
    is_read boolean DEFAULT false NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: security_companies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.security_companies (
    id integer NOT NULL,
    name text NOT NULL,
    license_key text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    whitelabel_settings text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.security_companies OWNER TO neondb_owner;

--
-- Name: security_companies_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.security_companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.security_companies_id_seq OWNER TO neondb_owner;

--
-- Name: security_companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.security_companies_id_seq OWNED BY public.security_companies.id;


--
-- Name: user_club_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_club_assignments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    club_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_club_assignments OWNER TO neondb_owner;

--
-- Name: user_club_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_club_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_club_assignments_id_seq OWNER TO neondb_owner;

--
-- Name: user_club_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_club_assignments_id_seq OWNED BY public.user_club_assignments.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    role public.user_role DEFAULT 'club_employee'::public.user_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    must_change_password boolean DEFAULT true NOT NULL,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: banned_guests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.banned_guests ALTER COLUMN id SET DEFAULT nextval('public.banned_guests_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: clubs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clubs ALTER COLUMN id SET DEFAULT nextval('public.clubs_id_seq'::regclass);


--
-- Name: guestlist_entries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.guestlist_entries ALTER COLUMN id SET DEFAULT nextval('public.guestlist_entries_id_seq'::regclass);


--
-- Name: guestlists id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.guestlists ALTER COLUMN id SET DEFAULT nextval('public.guestlists_id_seq'::regclass);


--
-- Name: licenses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.licenses ALTER COLUMN id SET DEFAULT nextval('public.licenses_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: security_companies id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.security_companies ALTER COLUMN id SET DEFAULT nextval('public.security_companies_id_seq'::regclass);


--
-- Name: user_club_assignments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_club_assignments ALTER COLUMN id SET DEFAULT nextval('public.user_club_assignments_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.activity_logs (id, action, description, user_id, club_id, metadata, created_at) FROM stdin;
1	license_generated	License generated for Jade Club	2	\N	\N	2025-06-17 14:04:43.065066
2	club_created	Club "Jade Club" was created	2	1	\N	2025-06-17 14:05:22.654544
3	user_updated	User profile updated: sallonikaG4	2	\N	\N	2025-06-17 14:37:43.033549
4	license_created	License created for Jade Club	2	\N	\N	2025-06-17 14:38:17.621197
5	platform_settings_updated	Platform settings updated	2	\N	\N	2025-06-17 14:48:59.766869
6	platform_settings_updated	Platform settings updated	2	\N	\N	2025-06-17 15:06:55.282591
7	platform_settings_updated	Platform settings updated	2	\N	\N	2025-06-17 15:21:03.111772
8	guest_banned	Guest "Chris Polytidis" was banned	2	1	\N	2025-06-17 15:31:47.396747
9	guestlist_created	Guestlist "Jade Event" was created	2	1	\N	2025-06-17 15:39:18.102804
10	guestlist_created	Guestlist "Jade Event2" was created	2	1	\N	2025-06-17 15:51:57.728434
11	club_deleted	Club "Jade Club" was deleted	2	\N	\N	2025-06-17 15:54:30.892674
12	user_created	User created: jojaz	2	\N	\N	2025-06-17 15:55:25.291602
13	user_impersonation	Started impersonating user: club_manager_demo	2	\N	\N	2025-06-18 06:15:00.97031
14	guestlist_created	Guestlist "Trois Rois Cast" was created	2	3	\N	2025-06-18 06:18:25.194816
15	guestlist_deleted	Guestlist deleted	2	\N	\N	2025-06-18 06:25:29.633266
16	guestlist_deleted	Guestlist deleted	2	\N	\N	2025-06-18 06:25:32.152379
17	guestlist_deleted	Guestlist deleted	2	\N	\N	2025-06-18 06:25:34.649037
18	guestlist_created	Guestlist "Trois Rois Cast" was created	2	3	\N	2025-06-18 06:25:48.326959
\.


--
-- Data for Name: banned_guests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.banned_guests (id, first_name, last_name, date_of_birth, nationality, id_number, id_type, photo_front, photo_back, ban_reason, police_incident_number, incident_date, incident_description, status, club_id, banned_by, revoked_by, revocation_reason, revoked_at, created_at, updated_at) FROM stdin;
1	Chris	Polytidis	1984-09-22	Greek	AK323360	national_id	\N	\N	Attack	das432	2025-06-17T00:00:00.000Z	Attack	banned_sl	1	2	\N	\N	\N	2025-06-17 15:31:47.362612	2025-06-17 15:31:47.362612
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chat_messages (id, message, from_user_id, to_user_id, club_id, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: clubs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clubs (id, name, address, city, country, license_key, license_status, is_active, smtp_settings, sms_settings, security_company_id, created_at, updated_at) FROM stdin;
3	Demo Club	123 Demo Street, Demo City	\N	\N	XESS-DEMO-CLUB-2024-TEST	active	t	\N	\N	\N	2025-06-18 05:49:17.861741	2025-06-18 05:49:17.861741
\.


--
-- Data for Name: guestlist_entries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.guestlist_entries (id, guestlist_id, first_name, last_name, email, phone, guest_count, comments, status, checked_in_at, checked_in_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: guestlists; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.guestlists (id, name, event_date, event_time, description, max_guests, is_active, club_id, created_by, created_at, updated_at, bookmetender_event_id, bookmetender_api_key, bookmetender_sync_enabled, last_bookmetender_sync) FROM stdin;
4	Trois Rois Cast	2025-06-18 10:25:00	\N	test	100	t	3	2	2025-06-18 06:25:48.300344	2025-06-18 06:25:48.300344	\N	\N	f	\N
\.


--
-- Data for Name: licenses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.licenses (id, organization, license_key, license_type, max_clubs, max_users, expiration_date, is_active, features, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, title, message, type, target_role, target_user_id, is_read, created_by, created_at) FROM stdin;
1	New Ban Alert	Chris Polytidis has been banned	warning	\N	\N	f	2	2025-06-17 15:31:47.41943
\.


--
-- Data for Name: security_companies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.security_companies (id, name, license_key, is_active, whitelabel_settings, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_club_assignments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_club_assignments (id, user_id, club_id, created_at) FROM stdin;
1	5	3	2025-06-18 05:49:18.293896
2	6	3	2025-06-18 05:49:18.293896
3	7	3	2025-06-18 05:49:18.293896
4	8	3	2025-06-18 05:49:18.293896
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, full_name, email, phone, role, is_active, must_change_password, last_login, created_at, updated_at) FROM stdin;
2	sallonikaG4	13c47634ede037060f9a2cd6ae23fc75657c6a14843b82b41d053b9c08a5de696a468c1b764bf9ccead6ad33e4f9366f34d59e49a2ce8d66d5561884306549f8.62b870528c6adced35fdd0a685a7bf1f	Chris Polytidis	polytidis@gmail.com	0762391761	super_admin	t	f	\N	2025-06-17 13:24:29.330892	2025-06-17 14:37:42.996
3	jojaz	123456	Joza Zeier	joza.zeier@watchman.gmbh	0762391761	club_manager	t	t	\N	2025-06-17 15:55:25.270009	2025-06-17 15:55:25.270009
4	admin_demo	$2b$10$rQZ8kqY.KXVL8fJGM1Wlau7TCwo0Ilt7SHzAIBpYLOOPeQ6Vm.Y6u	Admin Demo	admin@demo.com	+1234567890	admin	t	f	\N	2025-06-18 05:47:21.305234	2025-06-18 05:47:21.305234
5	club_manager_demo	$2b$10$rQZ8kqY.KXVL8fJGM1Wlau7TCwo0Ilt7SHzAIBpYLOOPeQ6Vm.Y6u	Club Manager Demo	manager@demo.com	+1234567891	club_manager	t	f	\N	2025-06-18 05:47:21.305234	2025-06-18 05:47:21.305234
6	security_lead_demo	$2b$10$rQZ8kqY.KXVL8fJGM1Wlau7TCwo0Ilt7SHzAIBpYLOOPeQ6Vm.Y6u	Security Leader Demo	lead@demo.com	+1234567892	security_teamleader	t	f	\N	2025-06-18 05:47:21.305234	2025-06-18 05:47:21.305234
7	security_staff_demo	$2b$10$rQZ8kqY.KXVL8fJGM1Wlau7TCwo0Ilt7SHzAIBpYLOOPeQ6Vm.Y6u	Security Staff Demo	staff@demo.com	+1234567893	security_personnel	t	f	\N	2025-06-18 05:47:21.305234	2025-06-18 05:47:21.305234
8	employee_demo	$2b$10$rQZ8kqY.KXVL8fJGM1Wlau7TCwo0Ilt7SHzAIBpYLOOPeQ6Vm.Y6u	Club Employee Demo	employee@demo.com	+1234567894	club_employee	t	f	\N	2025-06-18 05:47:21.305234	2025-06-18 05:47:21.305234
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 18, true);


--
-- Name: banned_guests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.banned_guests_id_seq', 1, true);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 1, false);


--
-- Name: clubs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.clubs_id_seq', 3, true);


--
-- Name: guestlist_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.guestlist_entries_id_seq', 1, false);


--
-- Name: guestlists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.guestlists_id_seq', 4, true);


--
-- Name: licenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.licenses_id_seq', 1, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, true);


--
-- Name: security_companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.security_companies_id_seq', 1, false);


--
-- Name: user_club_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_club_assignments_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: banned_guests banned_guests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.banned_guests
    ADD CONSTRAINT banned_guests_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: clubs clubs_license_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_license_key_unique UNIQUE (license_key);


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- Name: guestlist_entries guestlist_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.guestlist_entries
    ADD CONSTRAINT guestlist_entries_pkey PRIMARY KEY (id);


--
-- Name: guestlists guestlists_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.guestlists
    ADD CONSTRAINT guestlists_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_license_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_license_key_unique UNIQUE (license_key);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: security_companies security_companies_license_key_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.security_companies
    ADD CONSTRAINT security_companies_license_key_unique UNIQUE (license_key);


--
-- Name: security_companies security_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.security_companies
    ADD CONSTRAINT security_companies_pkey PRIMARY KEY (id);


--
-- Name: user_club_assignments user_club_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_club_assignments
    ADD CONSTRAINT user_club_assignments_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

