
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

COPY public.guestlists (id, name, event_date, event_time, description, max_guests, is_active, club_id, created_by, created_at, updated_at) FROM stdin;
4	Trois Rois Cast	2025-06-18 10:25:00	\N	test	100	t	3	2	2025-06-18 06:25:48.300344	2025-06-18 06:25:48.300344
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
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
3w0jrPybUpzRgbkdIFygemI6nIUtbR2I	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-18 13:24:30
kv5J6HnSe9HCRJHotGahWbrR3nYVamCx	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-18 15:03:49
RWB8cOBiGwqaQDfmgQVbh8zXm9KFiwYm	{"cookie":{"originalMaxAge":null,"expires":null,"httpOnly":true,"path":"/"},"passport":{"user":2}}	2025-06-19 06:45:12
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
-- Name: licenses licenses_license_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_license_key_key UNIQUE (license_key);


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
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


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
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


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

