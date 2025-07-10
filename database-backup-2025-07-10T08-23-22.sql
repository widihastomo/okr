--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

-- Started on 2025-07-10 08:23:22 UTC

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

DROP POLICY users_organization_policy ON public.users;
DROP POLICY teams_organization_policy ON public.teams;
DROP POLICY tasks_organization_policy ON public.tasks;
DROP POLICY success_metric_updates_organization_policy ON public.success_metric_updates;
DROP POLICY subscription_plans_update_policy ON public.subscription_plans;
DROP POLICY subscription_plans_read_policy ON public.subscription_plans;
DROP POLICY subscription_plans_modify_policy ON public.subscription_plans;
DROP POLICY subscription_plans_delete_policy ON public.subscription_plans;
DROP POLICY organizations_access_policy ON public.organizations;
DROP POLICY organization_subscriptions_access_policy ON public.organization_subscriptions;
DROP POLICY objectives_organization_policy ON public.objectives;
DROP POLICY key_results_organization_policy ON public.key_results;
DROP POLICY initiatives_organization_policy ON public.initiatives;
DROP POLICY initiative_success_metrics_organization_policy ON public.initiative_success_metrics;
DROP POLICY initiative_members_organization_policy ON public.initiative_members;
DROP POLICY check_ins_organization_policy ON public.check_ins;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_organization_id_fkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_invited_by_fkey;
ALTER TABLE ONLY public.user_trial_achievements DROP CONSTRAINT user_trial_achievements_user_id_fkey;
ALTER TABLE ONLY public.user_trial_achievements DROP CONSTRAINT user_trial_achievements_achievement_id_fkey;
ALTER TABLE ONLY public.user_stats DROP CONSTRAINT user_stats_user_id_users_id_fk;
ALTER TABLE ONLY public.user_permissions DROP CONSTRAINT user_permissions_user_id_fkey;
ALTER TABLE ONLY public.user_permissions DROP CONSTRAINT user_permissions_granted_by_fkey;
ALTER TABLE ONLY public.user_onboarding_progress DROP CONSTRAINT user_onboarding_progress_user_id_fkey;
ALTER TABLE ONLY public.user_activity_log DROP CONSTRAINT user_activity_log_user_id_fkey;
ALTER TABLE ONLY public.user_activity_log DROP CONSTRAINT user_activity_log_performed_by_fkey;
ALTER TABLE ONLY public.user_achievements DROP CONSTRAINT user_achievements_user_id_users_id_fk;
ALTER TABLE ONLY public.user_achievements DROP CONSTRAINT user_achievements_achievement_id_achievements_id_fk;
ALTER TABLE ONLY public.trial_progress DROP CONSTRAINT trial_progress_user_id_fkey;
ALTER TABLE ONLY public.trial_progress DROP CONSTRAINT trial_progress_organization_id_fkey;
ALTER TABLE ONLY public.teams DROP CONSTRAINT teams_organization_id_fkey;
ALTER TABLE ONLY public.tasks DROP CONSTRAINT tasks_initiative_id_initiatives_id_fk;
ALTER TABLE ONLY public.task_comments DROP CONSTRAINT task_comments_user_id_fkey;
ALTER TABLE ONLY public.task_comments DROP CONSTRAINT task_comments_task_id_fkey;
ALTER TABLE ONLY public.success_metric_updates DROP CONSTRAINT success_metric_updates_metric_id_fkey;
ALTER TABLE ONLY public.role_templates DROP CONSTRAINT role_templates_organization_id_fkey;
ALTER TABLE ONLY public.role_templates DROP CONSTRAINT role_templates_created_by_fkey;
ALTER TABLE ONLY public.organizations DROP CONSTRAINT organizations_rejected_by_fkey;
ALTER TABLE ONLY public.organizations DROP CONSTRAINT organizations_owner_id_fkey;
ALTER TABLE ONLY public.organization_subscriptions DROP CONSTRAINT organization_subscriptions_plan_id_fkey;
ALTER TABLE ONLY public.organization_subscriptions DROP CONSTRAINT organization_subscriptions_organization_id_fkey;
ALTER TABLE ONLY public.organization_add_on_subscriptions DROP CONSTRAINT organization_add_on_subscriptions_organization_id_fkey;
ALTER TABLE ONLY public.organization_add_on_subscriptions DROP CONSTRAINT organization_add_on_subscriptions_billing_period_id_fkey;
ALTER TABLE ONLY public.organization_add_on_subscriptions DROP CONSTRAINT organization_add_on_subscriptions_add_on_id_fkey;
ALTER TABLE ONLY public.objectives DROP CONSTRAINT objectives_team_id_teams_id_fk;
ALTER TABLE ONLY public.objectives DROP CONSTRAINT objectives_cycle_id_cycles_id_fk;
ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_user_id_fkey;
ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_organization_id_fkey;
ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_actor_id_fkey;
ALTER TABLE ONLY public.key_results DROP CONSTRAINT key_results_assigned_to_fkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_subscription_plan_id_fkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_organization_subscription_id_fkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_organization_id_fkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_created_by_fkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_billing_period_id_fkey;
ALTER TABLE ONLY public.invoice_line_items DROP CONSTRAINT invoice_line_items_subscription_plan_id_fkey;
ALTER TABLE ONLY public.invoice_line_items DROP CONSTRAINT invoice_line_items_invoice_id_fkey;
ALTER TABLE ONLY public.initiatives DROP CONSTRAINT initiatives_pic_id_users_id_fk;
ALTER TABLE ONLY public.initiatives DROP CONSTRAINT initiatives_key_result_id_key_results_id_fk;
ALTER TABLE ONLY public.initiatives DROP CONSTRAINT initiatives_closed_by_fkey;
ALTER TABLE ONLY public.initiative_success_metrics DROP CONSTRAINT initiative_success_metrics_initiative_id_fkey;
ALTER TABLE ONLY public.initiative_notes DROP CONSTRAINT initiative_notes_initiative_id_initiatives_id_fk;
ALTER TABLE ONLY public.initiative_notes DROP CONSTRAINT initiative_notes_created_by_users_id_fk;
ALTER TABLE ONLY public.initiative_members DROP CONSTRAINT initiative_members_user_id_users_id_fk;
ALTER TABLE ONLY public.initiative_members DROP CONSTRAINT initiative_members_initiative_id_initiatives_id_fk;
ALTER TABLE ONLY public.initiative_documents DROP CONSTRAINT initiative_documents_uploaded_by_users_id_fk;
ALTER TABLE ONLY public.initiative_documents DROP CONSTRAINT initiative_documents_initiative_id_initiatives_id_fk;
ALTER TABLE ONLY public.member_invitations DROP CONSTRAINT fk_member_invitations_organization;
ALTER TABLE ONLY public.member_invitations DROP CONSTRAINT fk_member_invitations_invited_by;
ALTER TABLE ONLY public.invoice_line_items DROP CONSTRAINT fk_invoice_line_items_add_on_id;
ALTER TABLE ONLY public.emoji_reactions DROP CONSTRAINT emoji_reactions_user_id_users_id_fk;
ALTER TABLE ONLY public.emoji_reactions DROP CONSTRAINT emoji_reactions_objective_id_objectives_id_fk;
ALTER TABLE ONLY public.daily_reflections DROP CONSTRAINT daily_reflections_user_id_fkey;
ALTER TABLE ONLY public.daily_reflections DROP CONSTRAINT daily_reflections_organization_id_fkey;
ALTER TABLE ONLY public.check_ins DROP CONSTRAINT check_ins_key_result_id_key_results_id_fk;
ALTER TABLE ONLY public.billing_periods DROP CONSTRAINT billing_periods_plan_id_fkey;
ALTER TABLE ONLY public.activity_logs DROP CONSTRAINT activity_logs_user_id_users_id_fk;
DROP INDEX public.idx_users_organization_id;
DROP INDEX public.idx_user_onboarding_progress_user_id;
DROP INDEX public.idx_teams_organization_id;
DROP INDEX public.idx_tasks_created_by;
DROP INDEX public.idx_objectives_owner_id;
DROP INDEX public.idx_key_results_objective_id;
DROP INDEX public.idx_initiatives_created_by;
DROP INDEX public.idx_daily_reflections_user_date;
DROP INDEX public.idx_application_settings_key;
DROP INDEX public.idx_application_settings_is_public;
DROP INDEX public.idx_application_settings_category;
DROP INDEX public."IDX_session_expire";
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_unique;
ALTER TABLE ONLY public.user_trial_achievements DROP CONSTRAINT user_trial_achievements_pkey;
ALTER TABLE ONLY public.user_stats DROP CONSTRAINT user_stats_user_id_unique;
ALTER TABLE ONLY public.user_stats DROP CONSTRAINT user_stats_pkey;
ALTER TABLE ONLY public.user_permissions DROP CONSTRAINT user_permissions_pkey;
ALTER TABLE ONLY public.user_onboarding_progress DROP CONSTRAINT user_onboarding_progress_user_id_key;
ALTER TABLE ONLY public.user_onboarding_progress DROP CONSTRAINT user_onboarding_progress_pkey;
ALTER TABLE ONLY public.user_activity_log DROP CONSTRAINT user_activity_log_pkey;
ALTER TABLE ONLY public.user_achievements DROP CONSTRAINT user_achievements_pkey;
ALTER TABLE ONLY public.trial_progress DROP CONSTRAINT trial_progress_pkey;
ALTER TABLE ONLY public.trial_achievements DROP CONSTRAINT trial_achievements_pkey;
ALTER TABLE ONLY public.templates DROP CONSTRAINT templates_pkey;
ALTER TABLE ONLY public.teams DROP CONSTRAINT teams_pkey;
ALTER TABLE ONLY public.team_members DROP CONSTRAINT team_members_pkey;
ALTER TABLE ONLY public.tasks DROP CONSTRAINT tasks_pkey;
ALTER TABLE ONLY public.task_comments DROP CONSTRAINT task_comments_pkey;
ALTER TABLE ONLY public.system_settings DROP CONSTRAINT system_settings_setting_key_key;
ALTER TABLE ONLY public.system_settings DROP CONSTRAINT system_settings_pkey;
ALTER TABLE ONLY public.success_metric_updates DROP CONSTRAINT success_metric_updates_pkey;
ALTER TABLE ONLY public.subscription_plans DROP CONSTRAINT subscription_plans_slug_key;
ALTER TABLE ONLY public.subscription_plans DROP CONSTRAINT subscription_plans_pkey;
ALTER TABLE ONLY public.subscription_add_ons DROP CONSTRAINT subscription_add_ons_slug_key;
ALTER TABLE ONLY public.subscription_add_ons DROP CONSTRAINT subscription_add_ons_pkey;
ALTER TABLE ONLY public.sessions DROP CONSTRAINT sessions_pkey;
ALTER TABLE ONLY public.role_templates DROP CONSTRAINT role_templates_pkey;
ALTER TABLE ONLY public.organizations DROP CONSTRAINT organizations_slug_key;
ALTER TABLE ONLY public.organizations DROP CONSTRAINT organizations_pkey;
ALTER TABLE ONLY public.organization_subscriptions DROP CONSTRAINT organization_subscriptions_pkey;
ALTER TABLE ONLY public.organization_add_on_subscriptions DROP CONSTRAINT organization_add_on_subscriptions_pkey;
ALTER TABLE ONLY public.objectives DROP CONSTRAINT objectives_pkey;
ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_pkey;
ALTER TABLE ONLY public.member_invitations DROP CONSTRAINT member_invitations_pkey;
ALTER TABLE ONLY public.member_invitations DROP CONSTRAINT member_invitations_invitation_token_key;
ALTER TABLE ONLY public.level_rewards DROP CONSTRAINT level_rewards_pkey;
ALTER TABLE ONLY public.level_rewards DROP CONSTRAINT level_rewards_level_unique;
ALTER TABLE ONLY public.key_results DROP CONSTRAINT key_results_pkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_pkey;
ALTER TABLE ONLY public.invoices DROP CONSTRAINT invoices_invoice_number_key;
ALTER TABLE ONLY public.invoice_line_items DROP CONSTRAINT invoice_line_items_pkey;
ALTER TABLE ONLY public.initiatives DROP CONSTRAINT initiatives_pkey;
ALTER TABLE ONLY public.initiative_success_metrics DROP CONSTRAINT initiative_success_metrics_pkey;
ALTER TABLE ONLY public.initiative_notes DROP CONSTRAINT initiative_notes_pkey;
ALTER TABLE ONLY public.initiative_members DROP CONSTRAINT initiative_members_pkey;
ALTER TABLE ONLY public.initiative_documents DROP CONSTRAINT initiative_documents_pkey;
ALTER TABLE ONLY public.emoji_reactions DROP CONSTRAINT emoji_reactions_pkey;
ALTER TABLE ONLY public.daily_reflections DROP CONSTRAINT daily_reflections_pkey;
ALTER TABLE ONLY public.cycles DROP CONSTRAINT cycles_pkey;
ALTER TABLE ONLY public.check_ins DROP CONSTRAINT check_ins_pkey;
ALTER TABLE ONLY public.billing_periods DROP CONSTRAINT billing_periods_pkey;
ALTER TABLE ONLY public.application_settings DROP CONSTRAINT application_settings_pkey;
ALTER TABLE ONLY public.application_settings DROP CONSTRAINT application_settings_key_key;
ALTER TABLE ONLY public.activity_logs DROP CONSTRAINT activity_logs_pkey;
ALTER TABLE ONLY public.achievements DROP CONSTRAINT achievements_pkey;
DROP TABLE public.users;
DROP TABLE public.user_trial_achievements;
DROP TABLE public.user_stats;
DROP TABLE public.user_permissions;
DROP TABLE public.user_onboarding_progress;
DROP TABLE public.user_activity_log;
DROP TABLE public.user_achievements;
DROP TABLE public.trial_progress;
DROP TABLE public.trial_achievements;
DROP TABLE public.templates;
DROP TABLE public.teams;
DROP TABLE public.team_members;
DROP TABLE public.tasks;
DROP TABLE public.task_comments;
DROP TABLE public.system_settings;
DROP TABLE public.success_metric_updates;
DROP TABLE public.subscription_plans;
DROP TABLE public.subscription_add_ons;
DROP TABLE public.sessions;
DROP TABLE public.role_templates;
DROP TABLE public.organizations;
DROP TABLE public.organization_subscriptions;
DROP TABLE public.organization_add_on_subscriptions;
DROP TABLE public.objectives;
DROP TABLE public.notifications;
DROP TABLE public.member_invitations;
DROP TABLE public.level_rewards;
DROP TABLE public.key_results;
DROP TABLE public.invoices;
DROP TABLE public.invoice_line_items;
DROP TABLE public.initiatives;
DROP TABLE public.initiative_success_metrics;
DROP TABLE public.initiative_notes;
DROP TABLE public.initiative_members;
DROP TABLE public.initiative_documents;
DROP TABLE public.emoji_reactions;
DROP TABLE public.daily_reflections;
DROP TABLE public.cycles;
DROP TABLE public.check_ins;
DROP TABLE public.billing_periods;
DROP TABLE public.application_settings;
DROP TABLE public.activity_logs;
DROP TABLE public.achievements;
DROP FUNCTION public.is_system_owner();
DROP FUNCTION public.get_current_user_id();
DROP FUNCTION public.get_current_organization_id();
--
-- TOC entry 269 (class 1255 OID 1745226)
-- Name: get_current_organization_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_organization_id() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
      BEGIN
        RETURN COALESCE(
          current_setting('app.current_organization_id', true)::UUID,
          NULL
        );
      END;
      $$;


--
-- TOC entry 270 (class 1255 OID 1745227)
-- Name: get_current_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_user_id() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
      BEGIN
        RETURN COALESCE(
          current_setting('app.current_user_id', true)::UUID,
          NULL
        );
      END;
      $$;


--
-- TOC entry 271 (class 1255 OID 1745228)
-- Name: is_system_owner(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_system_owner() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
      BEGIN
        RETURN COALESCE(
          current_setting('app.is_system_owner', true)::BOOLEAN,
          FALSE
        );
      END;
      $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 131072)
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    badge_icon text NOT NULL,
    badge_color text NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    condition jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    rarity text DEFAULT 'common'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 229 (class 1259 OID 131084)
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    points_earned integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 256 (class 1259 OID 1680777)
-- Name: application_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.application_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(255) NOT NULL,
    value text NOT NULL,
    category character varying(50) DEFAULT 'general'::character varying NOT NULL,
    description text,
    is_public boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 246 (class 1259 OID 1343532)
-- Name: billing_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_periods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    period_type text NOT NULL,
    period_months integer NOT NULL,
    price numeric(10,2) NOT NULL,
    discount_percentage integer DEFAULT 0,
    stripe_price_id text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 216 (class 1259 OID 81920)
-- Name: check_ins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.check_ins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key_result_id uuid NOT NULL,
    value numeric(15,2) NOT NULL,
    notes text,
    confidence integer DEFAULT 5 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    created_by uuid NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 81930)
-- Name: cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cycles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    start_date text NOT NULL,
    end_date text NOT NULL,
    status text DEFAULT 'planning'::text NOT NULL,
    description text
);


--
-- TOC entry 240 (class 1259 OID 270358)
-- Name: daily_reflections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_reflections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    date text NOT NULL,
    what_worked_well text,
    challenges text,
    tomorrow_priorities text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 234 (class 1259 OID 155648)
-- Name: emoji_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emoji_reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    objective_id uuid NOT NULL,
    user_id uuid NOT NULL,
    emoji text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 226 (class 1259 OID 114688)
-- Name: initiative_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.initiative_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    initiative_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    file_url text,
    file_name text,
    file_size integer,
    file_type text,
    category text DEFAULT 'general'::text NOT NULL,
    uploaded_by uuid NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 227 (class 1259 OID 114698)
-- Name: initiative_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.initiative_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    initiative_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    joined_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 233 (class 1259 OID 147456)
-- Name: initiative_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.initiative_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    initiative_id uuid NOT NULL,
    type text DEFAULT 'update'::text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    attachments text[],
    budget_amount numeric(15,2),
    budget_category text,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 235 (class 1259 OID 188416)
-- Name: initiative_success_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.initiative_success_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    initiative_id uuid NOT NULL,
    name text NOT NULL,
    target text NOT NULL,
    achievement text DEFAULT '0'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 218 (class 1259 OID 81939)
-- Name: initiatives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.initiatives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key_result_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'not_started'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    due_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    created_by uuid NOT NULL,
    pic_id uuid,
    start_date timestamp without time zone,
    completed_at timestamp without time zone,
    budget numeric(15,2),
    progress_percentage integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT now(),
    impact_score integer DEFAULT 5,
    effort_score integer DEFAULT 5,
    confidence_score integer DEFAULT 5,
    priority_score numeric(4,2) DEFAULT 5.0,
    budget_used numeric(15,2),
    final_result text,
    learning_insights text,
    closure_notes text,
    attachment_urls text[],
    closed_by uuid,
    closed_at timestamp without time zone
);


--
-- TOC entry 248 (class 1259 OID 1359973)
-- Name: invoice_line_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_line_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid,
    description text NOT NULL,
    quantity integer DEFAULT 1,
    unit_price character varying(20) NOT NULL,
    total_price character varying(20) NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0,
    period_start date,
    period_end date,
    subscription_plan_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    discount_amount numeric(10,2) DEFAULT 0,
    add_on_id uuid,
    metadata jsonb
);


--
-- TOC entry 247 (class 1259 OID 1359931)
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number character varying(50) NOT NULL,
    organization_id uuid,
    subscription_plan_id uuid,
    billing_period_id uuid,
    organization_subscription_id uuid,
    amount character varying(20) NOT NULL,
    subtotal character varying(20) NOT NULL,
    tax_amount character varying(20) DEFAULT '0'::character varying,
    tax_rate numeric(5,2) DEFAULT 0,
    currency character varying(3) DEFAULT 'IDR'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    issue_date date DEFAULT CURRENT_DATE,
    due_date date NOT NULL,
    paid_date date,
    payment_method character varying(50),
    description text,
    notes text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    stripe_invoice_id text,
    stripe_payment_intent_id text
);


--
-- TOC entry 219 (class 1259 OID 81950)
-- Name: key_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.key_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    objective_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    current_value numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    target_value numeric(15,2) NOT NULL,
    base_value numeric(15,2),
    unit text DEFAULT 'number'::text NOT NULL,
    key_result_type text DEFAULT 'increase_to'::text NOT NULL,
    status text DEFAULT 'on_track'::text NOT NULL,
    last_updated timestamp without time zone DEFAULT now(),
    confidence integer DEFAULT 5,
    time_progress_percentage integer DEFAULT 0,
    assigned_to uuid
);


--
-- TOC entry 230 (class 1259 OID 131094)
-- Name: level_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.level_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    level integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    badge_icon text NOT NULL,
    badge_color text NOT NULL,
    points_required integer NOT NULL,
    unlock_message text NOT NULL
);


--
-- TOC entry 257 (class 1259 OID 1681608)
-- Name: member_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    organization_id uuid NOT NULL,
    invited_by uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    department text,
    job_title text,
    invitation_token uuid DEFAULT gen_random_uuid(),
    status text DEFAULT 'pending'::text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    accepted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 242 (class 1259 OID 1024072)
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    entity_type character varying(50),
    entity_id uuid,
    entity_title character varying(255),
    actor_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp without time zone,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 220 (class 1259 OID 81964)
-- Name: objectives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.objectives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cycle_id uuid,
    title text NOT NULL,
    description text,
    owner text NOT NULL,
    owner_type text DEFAULT 'user'::text NOT NULL,
    owner_id uuid NOT NULL,
    status text DEFAULT 'not_started'::text NOT NULL,
    team_id uuid,
    parent_id uuid
);


--
-- TOC entry 250 (class 1259 OID 1384536)
-- Name: organization_add_on_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_add_on_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    add_on_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    billing_period_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    current_period_start timestamp without time zone NOT NULL,
    current_period_end timestamp without time zone NOT NULL,
    cancelled_at timestamp without time zone,
    stripe_subscription_item_id text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 239 (class 1259 OID 204825)
-- Name: organization_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    current_period_start timestamp without time zone NOT NULL,
    current_period_end timestamp without time zone NOT NULL,
    cancel_at timestamp without time zone,
    cancelled_at timestamp without time zone,
    trial_start timestamp without time zone,
    trial_end timestamp without time zone,
    stripe_subscription_id text,
    stripe_customer_id text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 238 (class 1259 OID 204813)
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    website text,
    industry text,
    size text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    owner_id uuid,
    registration_status text DEFAULT 'pending'::text,
    approved_by character varying(255),
    approved_at timestamp without time zone,
    rejected_by uuid,
    rejected_at timestamp without time zone,
    rejection_reason text,
    is_active boolean DEFAULT true,
    onboarding_completed boolean DEFAULT false,
    onboarding_completed_at timestamp without time zone,
    onboarding_data jsonb
);


--
-- TOC entry 244 (class 1259 OID 1073176)
-- Name: role_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    permissions jsonb NOT NULL,
    organization_id uuid,
    is_system boolean DEFAULT false,
    created_by uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 215 (class 1259 OID 24609)
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- TOC entry 249 (class 1259 OID 1368130)
-- Name: subscription_add_ons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_add_ons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    type text NOT NULL,
    stripe_price_id text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 237 (class 1259 OID 204800)
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    price numeric(10,2) NOT NULL,
    max_users integer,
    features jsonb NOT NULL,
    stripe_product_id text,
    stripe_price_id text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 236 (class 1259 OID 188433)
-- Name: success_metric_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.success_metric_updates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metric_id uuid NOT NULL,
    achievement text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by uuid NOT NULL
);


--
-- TOC entry 255 (class 1259 OID 1679626)
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    setting_value text,
    description text,
    category text DEFAULT 'email'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 241 (class 1259 OID 917504)
-- Name: task_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    mentioned_users text[] DEFAULT ARRAY[]::text[],
    is_edited boolean DEFAULT false,
    edited_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 221 (class 1259 OID 81974)
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    initiative_id uuid,
    title text NOT NULL,
    description text,
    status text DEFAULT 'not_started'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    assigned_to uuid,
    due_date timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    created_by uuid NOT NULL
);


--
-- TOC entry 222 (class 1259 OID 81985)
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    joined_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 223 (class 1259 OID 81995)
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    owner_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    organization_id uuid
);


--
-- TOC entry 224 (class 1259 OID 82005)
-- Name: templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    is_default boolean DEFAULT false,
    objectives text NOT NULL
);


--
-- TOC entry 252 (class 1259 OID 1499159)
-- Name: trial_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trial_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    category text NOT NULL,
    points integer DEFAULT 10 NOT NULL,
    trigger_type text NOT NULL,
    trigger_condition jsonb NOT NULL,
    is_active boolean DEFAULT true,
    trial_only boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 254 (class 1259 OID 1499191)
-- Name: trial_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trial_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    total_points integer DEFAULT 0,
    achievements_unlocked integer DEFAULT 0,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_activity_date timestamp without time zone,
    progress_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 231 (class 1259 OID 131104)
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    achievement_id uuid NOT NULL,
    unlocked_at timestamp without time zone DEFAULT now(),
    progress integer DEFAULT 0 NOT NULL,
    is_completed boolean DEFAULT false NOT NULL
);


--
-- TOC entry 245 (class 1259 OID 1073197)
-- Name: user_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    details jsonb,
    ip_address text,
    user_agent text,
    performed_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 251 (class 1259 OID 1425649)
-- Name: user_onboarding_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_onboarding_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    completed_tours text[] DEFAULT ARRAY[]::text[],
    is_first_time_user boolean DEFAULT true,
    last_tour_started_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    current_tour text,
    current_step_index integer DEFAULT 0,
    welcome_wizard_completed boolean DEFAULT false
);


--
-- TOC entry 243 (class 1259 OID 1073157)
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    permission text NOT NULL,
    resource text,
    granted_by uuid NOT NULL,
    granted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone
);


--
-- TOC entry 232 (class 1259 OID 131113)
-- Name: user_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    current_streak integer DEFAULT 0 NOT NULL,
    longest_streak integer DEFAULT 0 NOT NULL,
    last_activity_date text,
    objectives_completed integer DEFAULT 0 NOT NULL,
    key_results_completed integer DEFAULT 0 NOT NULL,
    check_ins_created integer DEFAULT 0 NOT NULL,
    initiatives_created integer DEFAULT 0 NOT NULL,
    collaboration_score integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 253 (class 1259 OID 1499172)
-- Name: user_trial_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_trial_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    achievement_id uuid NOT NULL,
    unlocked_at timestamp without time zone DEFAULT now(),
    points_earned integer NOT NULL,
    metadata jsonb
);


--
-- TOC entry 225 (class 1259 OID 82014)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    profile_image_url character varying(500),
    role text DEFAULT 'member'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    organization_id uuid,
    is_system_owner boolean DEFAULT false NOT NULL,
    department text,
    job_title text,
    last_login_at timestamp without time zone,
    invited_by uuid,
    invited_at timestamp without time zone,
    reminder_config jsonb,
    phone character varying(20),
    verification_code character varying(10),
    verification_code_expiry timestamp without time zone,
    is_email_verified boolean DEFAULT false NOT NULL
);


--
-- TOC entry 3903 (class 0 OID 131072)
-- Dependencies: 228
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.achievements (id, name, description, category, badge_icon, badge_color, points, condition, is_active, rarity, created_at) FROM stdin;
\.


--
-- TOC entry 3904 (class 0 OID 131084)
-- Dependencies: 229
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_logs (id, user_id, action, entity_type, entity_id, points_earned, metadata, created_at) FROM stdin;
\.


--
-- TOC entry 3931 (class 0 OID 1680777)
-- Dependencies: 256
-- Data for Name: application_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.application_settings (id, key, value, category, description, is_public, created_at, updated_at) FROM stdin;
9ee993bf-29fc-4b99-8059-c9538dfae43f	app_name	OKR Management System	general	Nama aplikasi yang ditampilkan di header dan title	t	2025-07-09 16:55:53.755144+00	2025-07-09 16:55:53.755144+00
ac9660dd-bd5a-498b-a5cf-79a553eb8305	app_description	Platform manajemen OKR untuk pencapaian tujuan organisasi	general	Deskripsi singkat aplikasi	t	2025-07-09 16:55:53.830385+00	2025-07-09 16:55:53.830385+00
2b586686-e17c-4aa9-b2cd-9952160ba0bd	app_version	1.0.0	general	Versi aplikasi saat ini	t	2025-07-09 16:55:53.84885+00	2025-07-09 16:55:53.84885+00
0c8749e3-184e-4bd8-9a02-102d9a9c94d9	company_name	Your Company	general	Nama perusahaan yang mengoperasikan platform	t	2025-07-09 16:55:53.870875+00	2025-07-09 16:55:53.870875+00
ed8d1c58-b211-43aa-8ccc-cfe7ea377d7a	contact_email	admin@yourcompany.com	general	Email kontak untuk support dan pertanyaan	t	2025-07-09 16:55:53.88954+00	2025-07-09 16:55:53.88954+00
f921aafa-8739-4e04-a8ff-9a7f57d31d1e	support_phone	+62-21-12345678	general	Nomor telepon support	t	2025-07-09 16:55:53.909939+00	2025-07-09 16:55:53.909939+00
549db3bf-1aab-45a7-9371-1e98d0e9a6d4	primary_color	#f97316	appearance	Warna utama aplikasi (orange)	t	2025-07-09 16:55:53.928141+00	2025-07-09 16:55:53.928141+00
96e2751b-548b-4dad-8fd2-dd78b400182f	secondary_color	#dc2626	appearance	Warna sekunder aplikasi (red)	t	2025-07-09 16:55:53.947544+00	2025-07-09 16:55:53.947544+00
9dcc436f-8b3a-4e00-8b60-feb865311d7c	logo_url	/assets/logo.png	appearance	URL logo aplikasi	t	2025-07-09 16:55:53.966818+00	2025-07-09 16:55:53.966818+00
f6c64fc5-d4e6-4689-961e-078fa2d6db1f	favicon_url	/assets/favicon.ico	appearance	URL favicon aplikasi	t	2025-07-09 16:55:53.986867+00	2025-07-09 16:55:53.986867+00
06fd71de-e1b1-41b8-a967-bf7f7f33edd0	max_login_attempts	5	security	Maksimal percobaan login sebelum akun dikunci	f	2025-07-09 16:55:54.004848+00	2025-07-09 16:55:54.004848+00
2d0dfaf4-207f-4035-8d6d-e0b7578c8c04	session_timeout	86400	security	Durasi session timeout dalam detik (24 jam)	f	2025-07-09 16:55:54.025357+00	2025-07-09 16:55:54.025357+00
7670d3c8-866f-4798-b978-b0f21901cccd	password_min_length	8	security	Panjang minimum password	f	2025-07-09 16:55:54.044336+00	2025-07-09 16:55:54.044336+00
5f3043c0-43dd-4915-82ef-99144711659d	enable_registration	true	feature	Mengizinkan registrasi pengguna baru	t	2025-07-09 16:55:54.06421+00	2025-07-09 16:55:54.06421+00
50480039-1e13-406b-b0c0-bfff2cd4bc23	enable_trial	true	feature	Mengaktifkan fitur free trial	t	2025-07-09 16:55:54.082502+00	2025-07-09 16:55:54.082502+00
351ef1a6-809c-4e88-a412-6056b653a09f	trial_duration_days	7	feature	Durasi free trial dalam hari	t	2025-07-09 16:55:54.101273+00	2025-07-09 16:55:54.101273+00
b32940e8-1c7d-46b2-bfd5-dc0240095a88	max_users_per_trial	3	feature	Maksimal pengguna per organisasi trial	t	2025-07-09 16:55:54.119728+00	2025-07-09 16:55:54.119728+00
431ce782-5f7d-4d12-ac67-777eb419bc41	smtp_host	smtp.gmail.com	email	SMTP server host untuk email	f	2025-07-09 16:55:54.138496+00	2025-07-09 16:55:54.138496+00
67a8f8ed-99f2-44f9-9328-d33a1adc0ec9	smtp_port	587	email	SMTP server port	f	2025-07-09 16:55:54.156895+00	2025-07-09 16:55:54.156895+00
5142bd50-3f20-4cd1-ad0a-28c347b4e7a6	smtp_username		email	Username SMTP untuk autentikasi	f	2025-07-09 16:55:54.177327+00	2025-07-09 16:55:54.177327+00
b9ae145a-f03d-40e3-bbfb-d13d151f875e	from_email	noreply@yourcompany.com	email	Email pengirim untuk notifikasi sistem	f	2025-07-09 16:55:54.194485+00	2025-07-09 16:55:54.194485+00
c2ec11b1-cd42-4056-9e36-d12c007b6ef0	from_name	OKR Management System	email	Nama pengirim email	f	2025-07-09 16:55:54.212978+00	2025-07-09 16:55:54.212978+00
5424c239-3e55-461c-8b03-79079abb0d5c	enable_push_notifications	true	notification	Mengaktifkan push notifications	t	2025-07-09 16:55:54.230552+00	2025-07-09 16:55:54.230552+00
3bbcd9fa-aa33-4856-a415-0ae5e30276f7	enable_email_notifications	true	notification	Mengaktifkan email notifications	t	2025-07-09 16:55:54.249731+00	2025-07-09 16:55:54.249731+00
88469234-8402-48c0-b203-d622b7d93759	notification_check_interval	60	notification	Interval pengecekan notifikasi dalam detik	f	2025-07-09 16:55:54.268751+00	2025-07-09 16:55:54.268751+00
6eb3de75-be20-4fdd-a80e-014f1f5715f4	maintenance_mode	false	general	Mode maintenance untuk aplikasi	f	2025-07-09 16:55:54.287892+00	2025-07-09 16:55:54.287892+00
f064feb9-1905-4e04-9cfc-eb7b002cdbb8	maintenance_message	Sistem sedang dalam maintenance. Silakan coba lagi nanti.	general	Pesan yang ditampilkan saat maintenance mode	f	2025-07-09 16:55:54.306113+00	2025-07-09 16:55:54.306113+00
82cf2d15-f20f-4a60-93ba-d09b5770772a	max_file_upload_size	10485760	general	Maksimal ukuran file upload dalam bytes (10MB)	f	2025-07-09 16:55:54.325319+00	2025-07-09 16:55:54.325319+00
08f2cd06-8286-46ef-850e-c4599100df57	allowed_file_types	jpg,jpeg,png,pdf,doc,docx,xls,xlsx,ppt,pptx	general	Jenis file yang diizinkan untuk upload	f	2025-07-09 16:55:54.342853+00	2025-07-09 16:55:54.342853+00
c3c750db-8e55-451a-8e4f-edccaa5f4636	backup_enabled	true	security	Mengaktifkan backup otomatis database	f	2025-07-09 16:55:54.361727+00	2025-07-09 16:55:54.361727+00
b14aa16f-eb9a-4cc0-a092-d40befdb4027	backup_frequency	daily	security	Frekuensi backup otomatis (daily, weekly, monthly)	f	2025-07-09 16:55:54.378393+00	2025-07-09 16:55:54.378393+00
\.


--
-- TOC entry 3921 (class 0 OID 1343532)
-- Dependencies: 246
-- Data for Name: billing_periods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_periods (id, plan_id, period_type, period_months, price, discount_percentage, stripe_price_id, is_active, created_at, updated_at) FROM stdin;
35f7e6f9-472a-47f6-a823-f2d70c9991af	f844f00f-a4c3-4c05-a779-a4ad36cd4662	monthly	1	99000.00	0	\N	t	2025-07-09 17:17:13.379144	2025-07-09 17:17:13.379144
7a6a4606-7f1c-404d-be8c-3351b55a950d	f844f00f-a4c3-4c05-a779-a4ad36cd4662	quarterly	3	282150.00	5	\N	t	2025-07-09 17:17:13.379144	2025-07-09 17:17:13.379144
03efeea8-fdc2-4733-9eeb-f6caf3d468b6	f844f00f-a4c3-4c05-a779-a4ad36cd4662	annual	12	1009800.00	15	\N	t	2025-07-09 17:17:13.379144	2025-07-09 17:17:13.379144
54e3088a-c745-4e31-88c6-624df30c7063	0c68af8a-6356-47f3-a7ef-b59411815756	monthly	1	299000.00	0	\N	t	2025-07-09 17:17:13.379144	2025-07-09 17:17:13.379144
38b9d056-d998-485d-b31f-058a33c28cf8	0c68af8a-6356-47f3-a7ef-b59411815756	quarterly	3	852150.00	5	\N	t	2025-07-09 17:17:13.379144	2025-07-09 17:17:13.379144
cf279e90-0b03-4eff-9e2f-fd8220551082	0c68af8a-6356-47f3-a7ef-b59411815756	annual	12	3049800.00	15	\N	t	2025-07-09 17:17:13.379144	2025-07-09 17:17:13.379144
c0ec47fb-a463-4ba9-8148-5c75f684c3e6	b30e1589-0ef6-4cb6-86b3-8aba177ac82d	monthly	1	749000.00	0	\N	t	2025-07-09 17:17:13.379144	2025-07-09 17:17:13.379144
b77235ed-204d-41cf-9939-8213b942f15f	b30e1589-0ef6-4cb6-86b3-8aba177ac82d	quarterly	3	2134650.00	5	\N	t	2025-07-09 17:17:13.379144	2025-07-09 17:17:13.379144
f7103d98-b711-423c-a1d0-844dc0e5c879	b30e1589-0ef6-4cb6-86b3-8aba177ac82d	annual	12	7639800.00	15	\N	t	2025-07-09 17:17:13.379144	2025-07-09 17:17:13.379144
\.


--
-- TOC entry 3891 (class 0 OID 81920)
-- Dependencies: 216
-- Data for Name: check_ins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.check_ins (id, key_result_id, value, notes, confidence, created_at, created_by) FROM stdin;
3a7d3814-9eb5-4a3b-90a1-ae14cec2710f	fb434d89-c83f-461c-bedd-d98b990dfe2f	350.00	Good progress on database query optimization	80	2025-07-09 17:17:08.051882	d26cc3e4-1237-410b-abd3-44332b6c2897
\.


--
-- TOC entry 3892 (class 0 OID 81930)
-- Dependencies: 217
-- Data for Name: cycles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cycles (id, name, type, start_date, end_date, status, description) FROM stdin;
d9294c13-41bf-405c-a287-48a45370feff	Q1 2025	quarterly	2025-01-01	2025-03-31	completed	First quarter objectives for 2025
363af44f-d89f-4097-9be6-62684e8dc81f	Triwulanan - Juli 2025	quarterly	2025-07-01T00:00:00.000Z	2025-08-31T00:00:00.000Z	active	Siklus pertama dari hasil onboarding perusahaan - penjualan
\.


--
-- TOC entry 3915 (class 0 OID 270358)
-- Dependencies: 240
-- Data for Name: daily_reflections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_reflections (id, user_id, organization_id, date, what_worked_well, challenges, tomorrow_priorities, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3909 (class 0 OID 155648)
-- Dependencies: 234
-- Data for Name: emoji_reactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.emoji_reactions (id, objective_id, user_id, emoji, created_at) FROM stdin;
\.


--
-- TOC entry 3901 (class 0 OID 114688)
-- Dependencies: 226
-- Data for Name: initiative_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.initiative_documents (id, initiative_id, title, description, file_url, file_name, file_size, file_type, category, uploaded_by, uploaded_at) FROM stdin;
\.


--
-- TOC entry 3902 (class 0 OID 114698)
-- Dependencies: 227
-- Data for Name: initiative_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.initiative_members (id, initiative_id, user_id, role, joined_at) FROM stdin;
\.


--
-- TOC entry 3908 (class 0 OID 147456)
-- Dependencies: 233
-- Data for Name: initiative_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.initiative_notes (id, initiative_id, type, title, content, attachments, budget_amount, budget_category, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3910 (class 0 OID 188416)
-- Dependencies: 235
-- Data for Name: initiative_success_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.initiative_success_metrics (id, initiative_id, name, target, achievement, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3893 (class 0 OID 81939)
-- Dependencies: 218
-- Data for Name: initiatives; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.initiatives (id, key_result_id, title, description, status, priority, due_date, created_at, created_by, pic_id, start_date, completed_at, budget, progress_percentage, updated_at, impact_score, effort_score, confidence_score, priority_score, budget_used, final_result, learning_insights, closure_notes, attachment_urls, closed_by, closed_at) FROM stdin;
bfb33c0f-1905-46e4-b40e-fd1b05e6c8b4	fb434d89-c83f-461c-bedd-d98b990dfe2f	Database Query Optimization	Optimize slow database queries and add proper indexing	in_progress	medium	2025-02-28 00:00:00	2025-07-09 17:17:08.077212	5cb5c87c-384d-4c92-ad1f-15fe74a1702c	\N	\N	\N	\N	0	2025-07-09 17:17:08.077212	5	5	5	5.00	\N	\N	\N	\N	\N	\N	\N
be927fb7-b367-482e-8663-a958811d58ee	cfcca17a-c0f2-4055-8ba8-bfc5d9760263	Menjalankan kampanye promosi bulanan dengan diskon 20%	Inisiatif dari hasil onboarding	draft	medium	\N	2025-07-09 18:26:57.980476	b7dd3960-5a94-42e5-8415-3f5088452ec6	b7dd3960-5a94-42e5-8415-3f5088452ec6	\N	\N	\N	0	2025-07-09 18:26:57.980476	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
731b9cae-6078-42e0-b9d4-9a25370ac514	cfcca17a-c0f2-4055-8ba8-bfc5d9760263	Melatih sales team untuk closing technique	Inisiatif dari hasil onboarding	draft	medium	\N	2025-07-09 18:26:57.980476	b7dd3960-5a94-42e5-8415-3f5088452ec6	b7dd3960-5a94-42e5-8415-3f5088452ec6	\N	\N	\N	0	2025-07-09 18:26:57.980476	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
db0d5386-a7f5-4bee-b897-644d65e7f95f	cfcca17a-c0f2-4055-8ba8-bfc5d9760263	Membuat program bundling produk dengan harga spesial	Inisiatif dari hasil onboarding	draft	medium	\N	2025-07-09 18:26:57.980476	b7dd3960-5a94-42e5-8415-3f5088452ec6	b7dd3960-5a94-42e5-8415-3f5088452ec6	\N	\N	\N	0	2025-07-09 18:26:57.980476	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
10348f0a-50a0-4b73-962f-0b3e13ba0b47	17c1f28c-8efb-4f2c-8254-9a713ebf7d45	Menjalankan kampanye promosi bulanan dengan diskon 20%	Inisiatif dari hasil onboarding	draft	medium	\N	2025-07-10 02:11:18.941461	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	\N	\N	\N	0	2025-07-10 02:11:18.941461	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
0a052cb4-4496-4cb1-81ee-b41a60ef729c	17c1f28c-8efb-4f2c-8254-9a713ebf7d45	Melatih sales team untuk closing technique	Inisiatif dari hasil onboarding	draft	medium	\N	2025-07-10 02:11:18.941461	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	\N	\N	\N	0	2025-07-10 02:11:18.941461	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
509ced93-5976-4038-b5d1-30ed4414ea9e	17c1f28c-8efb-4f2c-8254-9a713ebf7d45	Membuat program bundling produk dengan harga spesial	Inisiatif dari hasil onboarding	draft	medium	\N	2025-07-10 02:11:18.941461	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	\N	\N	\N	0	2025-07-10 02:11:18.941461	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
bf884146-c37c-486b-be45-e41563fc5681	e53bf12b-7899-4004-81f2-2f6047a4c8f5	Menjalankan kampanye promosi bulanan dengan diskon 20%	Inisiatif dari hasil onboarding	draft	medium	\N	2025-07-10 04:14:13.729347	72279bc5-a4ce-40b7-af12-52a9dbeacfde	72279bc5-a4ce-40b7-af12-52a9dbeacfde	\N	\N	\N	0	2025-07-10 04:14:13.729347	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
3867eab2-e747-42dd-bc26-f88b620ebc0c	e53bf12b-7899-4004-81f2-2f6047a4c8f5	Melatih sales team untuk closing technique	Inisiatif dari hasil onboarding	draft	medium	\N	2025-07-10 04:14:13.729347	72279bc5-a4ce-40b7-af12-52a9dbeacfde	72279bc5-a4ce-40b7-af12-52a9dbeacfde	\N	\N	\N	0	2025-07-10 04:14:13.729347	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
8ed09f42-42fa-4949-93af-08aa9df65580	e53bf12b-7899-4004-81f2-2f6047a4c8f5	Membuat program bundling produk dengan harga spesial	Inisiatif dari hasil onboarding	draft	medium	\N	2025-07-10 04:14:13.729347	72279bc5-a4ce-40b7-af12-52a9dbeacfde	72279bc5-a4ce-40b7-af12-52a9dbeacfde	\N	\N	\N	0	2025-07-10 04:14:13.729347	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
2cda9c5d-9328-4b3a-ae8f-0a9dba96f0c0	f64e73a1-6ae8-4d6c-b0be-76bf90a41404	Menjalankan kampanye promosi bulanan dengan diskon 20%	Inisiatif dari hasil onboarding	draft	medium	\N	2025-07-10 04:22:08.321252	72279bc5-a4ce-40b7-af12-52a9dbeacfde	72279bc5-a4ce-40b7-af12-52a9dbeacfde	\N	\N	\N	0	2025-07-10 04:22:08.321252	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
884c2e51-358b-4bd3-b5f3-65d540d049a5	f64e73a1-6ae8-4d6c-b0be-76bf90a41404	Melatih sales team untuk closing technique	Inisiatif dari hasil onboarding	draft	medium	\N	2025-07-10 04:22:08.321252	72279bc5-a4ce-40b7-af12-52a9dbeacfde	72279bc5-a4ce-40b7-af12-52a9dbeacfde	\N	\N	\N	0	2025-07-10 04:22:08.321252	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
5e74f50d-2541-464c-8906-9c07aa189e38	f64e73a1-6ae8-4d6c-b0be-76bf90a41404	Membuat program bundling produk dengan harga spesial	Inisiatif dari hasil onboarding	draft	medium	\N	2025-07-10 04:22:08.321252	72279bc5-a4ce-40b7-af12-52a9dbeacfde	72279bc5-a4ce-40b7-af12-52a9dbeacfde	\N	\N	\N	0	2025-07-10 04:22:08.321252	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
6cf5b726-966c-48a6-88d6-6c12f4630c7a	cd8052d3-9f7d-4db2-9280-b1566a8ebd7b	Menjalankan kampanye promosi bulanan dengan diskon 20%	Inisiatif dari hasil onboarding	draft	medium	2025-07-31 00:33:47.945	2025-07-10 04:23:00.739585	72279bc5-a4ce-40b7-af12-52a9dbeacfde	72279bc5-a4ce-40b7-af12-52a9dbeacfde	\N	\N	\N	0	2025-07-10 04:23:00.739585	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
97d8c409-76b7-44cc-855f-5761b06bdc0e	cd8052d3-9f7d-4db2-9280-b1566a8ebd7b	Melatih sales team untuk closing technique	Inisiatif dari hasil onboarding	draft	medium	2025-08-01 12:48:24.899	2025-07-10 04:23:00.739585	72279bc5-a4ce-40b7-af12-52a9dbeacfde	72279bc5-a4ce-40b7-af12-52a9dbeacfde	\N	\N	\N	0	2025-07-10 04:23:00.739585	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
555b03dd-5f12-488e-b060-36c439a8c313	cd8052d3-9f7d-4db2-9280-b1566a8ebd7b	Membuat program bundling produk dengan harga spesial	Inisiatif dari hasil onboarding	draft	medium	2025-07-31 00:09:23.717	2025-07-10 04:23:00.739585	72279bc5-a4ce-40b7-af12-52a9dbeacfde	72279bc5-a4ce-40b7-af12-52a9dbeacfde	\N	\N	\N	0	2025-07-10 04:23:00.739585	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
31acc666-f442-4c8f-aa7d-15a45901d6a1	841c0c8d-01db-416c-91fd-033cc93a615b	Menjalankan kampanye promosi bulanan dengan diskon 20%	Inisiatif dari hasil onboarding	draft	medium	2025-11-17 23:33:40.134	2025-07-10 05:07:24.536138	ff1f458e-af29-4b1b-aa16-2e6b32833e6a	ff1f458e-af29-4b1b-aa16-2e6b32833e6a	\N	\N	\N	0	2025-07-10 05:07:24.536138	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
8020c867-e0fe-4797-ae1a-3ac4bbfec977	92252d79-3b2a-45a4-8a7d-1f9224665f48	Menjalankan kampanye promosi bulanan dengan diskon 20%	Inisiatif dari hasil onboarding	draft	medium	2025-08-01 20:35:48.575	2025-07-10 05:28:49.10786	955b3705-14e4-4fd7-afa0-47d8e2475edf	955b3705-14e4-4fd7-afa0-47d8e2475edf	\N	\N	\N	0	2025-07-10 05:28:49.10786	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
4dd866e6-2e68-4f47-8bf9-610adf68fa76	92252d79-3b2a-45a4-8a7d-1f9224665f48	Membuat program bundling produk dengan harga spesial	Inisiatif dari hasil onboarding	draft	medium	2025-07-20 10:44:19.896	2025-07-10 05:28:49.10786	955b3705-14e4-4fd7-afa0-47d8e2475edf	955b3705-14e4-4fd7-afa0-47d8e2475edf	\N	\N	\N	0	2025-07-10 05:28:49.10786	3	3	3	3.00	\N	\N	\N	\N	\N	\N	\N
\.


--
-- TOC entry 3923 (class 0 OID 1359973)
-- Dependencies: 248
-- Data for Name: invoice_line_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_line_items (id, invoice_id, description, quantity, unit_price, total_price, discount_percentage, period_start, period_end, subscription_plan_id, created_at, discount_amount, add_on_id, metadata) FROM stdin;
\.


--
-- TOC entry 3922 (class 0 OID 1359931)
-- Dependencies: 247
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_number, organization_id, subscription_plan_id, billing_period_id, organization_subscription_id, amount, subtotal, tax_amount, tax_rate, currency, status, issue_date, due_date, paid_date, payment_method, description, notes, created_by, created_at, updated_at, stripe_invoice_id, stripe_payment_intent_id) FROM stdin;
\.


--
-- TOC entry 3894 (class 0 OID 81950)
-- Dependencies: 219
-- Data for Name: key_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.key_results (id, objective_id, title, description, current_value, target_value, base_value, unit, key_result_type, status, last_updated, confidence, time_progress_percentage, assigned_to) FROM stdin;
fb434d89-c83f-461c-bedd-d98b990dfe2f	3fe7b8fc-9bed-41ee-9d0d-935f34b3c7f6	Reduce API Response Time	Optimize database queries and API endpoints	250.00	100.00	500.00	number	decrease_to	on_track	2025-07-09 17:17:08.028437	75	25	\N
f66ffab0-d566-46e9-8136-af7c31bf202a	66f27cfe-f21f-4616-8202-e4e24e235e0b	Increase User Satisfaction Score	Improve overall user experience rating	4.20	4.80	4.00	number	increase_to	not_started	2025-07-09 17:17:08.028437	60	0	\N
cfcca17a-c0f2-4055-8ba8-bfc5d9760263	abb6be85-cb01-4e10-bd84-5375cc7eb0c4	Mencapai target penjualan Rp 500 juta per bulan	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-09 18:26:57.937457	5	0	b7dd3960-5a94-42e5-8415-3f5088452ec6
134a0d3e-c7f9-4031-be1c-9593ad9e6289	abb6be85-cb01-4e10-bd84-5375cc7eb0c4	Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-09 18:26:57.937457	5	0	b7dd3960-5a94-42e5-8415-3f5088452ec6
17c1f28c-8efb-4f2c-8254-9a713ebf7d45	083f9717-08ed-4fa8-86a0-ec03e91f5b64	Mencapai target penjualan Rp 500 juta per bulan	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-10 02:11:18.893542	5	0	ff7372d7-0c07-40b3-a76a-7c745b89f7a5
9c84c1e8-a8ea-4bb9-950c-5e7622956135	083f9717-08ed-4fa8-86a0-ec03e91f5b64	Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-10 02:11:18.893542	5	0	ff7372d7-0c07-40b3-a76a-7c745b89f7a5
e53bf12b-7899-4004-81f2-2f6047a4c8f5	cfe90273-d75f-45a4-b2e7-858da89d636f	Mencapai target penjualan Rp 500 juta per bulan	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-10 04:14:13.647814	5	0	72279bc5-a4ce-40b7-af12-52a9dbeacfde
8df957bc-e060-4c0f-9d8d-d07b141b8c4a	cfe90273-d75f-45a4-b2e7-858da89d636f	Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-10 04:14:13.647814	5	0	72279bc5-a4ce-40b7-af12-52a9dbeacfde
f64e73a1-6ae8-4d6c-b0be-76bf90a41404	d19cc8dd-6ea9-4bb7-94ee-0c02a0b399ac	Mencapai target penjualan Rp 500 juta per bulan	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-10 04:22:08.262734	5	0	72279bc5-a4ce-40b7-af12-52a9dbeacfde
8f890c24-dcc0-40b0-a5bf-5b907bd55b65	d19cc8dd-6ea9-4bb7-94ee-0c02a0b399ac	Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-10 04:22:08.262734	5	0	72279bc5-a4ce-40b7-af12-52a9dbeacfde
cd8052d3-9f7d-4db2-9280-b1566a8ebd7b	884bfc71-6ac7-4f31-82b8-65740de713d7	Mencapai target penjualan Rp 500 juta per bulan	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-10 04:23:00.698916	5	0	72279bc5-a4ce-40b7-af12-52a9dbeacfde
6001db9a-8a4e-487f-a541-99859c153a38	884bfc71-6ac7-4f31-82b8-65740de713d7	Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-10 04:23:00.698916	5	0	72279bc5-a4ce-40b7-af12-52a9dbeacfde
841c0c8d-01db-416c-91fd-033cc93a615b	cc2c92cd-983c-4b3e-a6d4-4c515b30347e	Mencapai target penjualan Rp 500 juta per bulan	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-10 05:07:24.497782	5	0	ff1f458e-af29-4b1b-aa16-2e6b32833e6a
92252d79-3b2a-45a4-8a7d-1f9224665f48	07b53487-696c-45d4-ae4b-5c5dea9022ba	Mencapai target penjualan Rp 500 juta per bulan	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-10 05:28:49.054142	5	0	955b3705-14e4-4fd7-afa0-47d8e2475edf
8a24eb46-9fda-4b5e-a8d9-b3f1af068cb6	07b53487-696c-45d4-ae4b-5c5dea9022ba	Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta	Key result dari hasil onboarding	0.00	100.00	\N	percentage	increase_to	on_track	2025-07-10 05:28:49.054142	5	0	955b3705-14e4-4fd7-afa0-47d8e2475edf
\.


--
-- TOC entry 3905 (class 0 OID 131094)
-- Dependencies: 230
-- Data for Name: level_rewards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.level_rewards (id, level, title, description, badge_icon, badge_color, points_required, unlock_message) FROM stdin;
\.


--
-- TOC entry 3932 (class 0 OID 1681608)
-- Dependencies: 257
-- Data for Name: member_invitations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.member_invitations (id, email, organization_id, invited_by, role, department, job_title, invitation_token, status, expires_at, accepted_at, created_at, updated_at) FROM stdin;
0939b904-f46f-4b46-a94f-34db86465087	test1@example.com	003b9e19-92f7-4c3d-98f1-a3d597a3563e	b7dd3960-5a94-42e5-8415-3f5088452ec6	member	\N	\N	9d47ee4a-6d88-48cb-8f84-da39b8265954	pending	2025-07-16 18:35:13.881	\N	2025-07-09 18:35:13.889207	2025-07-09 18:35:13.889207
3debb71c-5652-4936-acfc-29a1ba2df7ec	test2@example.com	003b9e19-92f7-4c3d-98f1-a3d597a3563e	b7dd3960-5a94-42e5-8415-3f5088452ec6	member	\N	\N	a5a10bfa-cfc4-4945-8e31-37d3de5bbbfb	pending	2025-07-16 18:35:14.861	\N	2025-07-09 18:35:14.870971	2025-07-09 18:35:14.870971
547a33bf-bff3-4869-8609-f8314f2beaae	nana@mail.com	9d818f66-05e6-4f16-b086-b42a75477db4	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	member	\N	\N	3d769b45-436e-4a8c-bc94-34e1e26a376a	pending	2025-07-17 02:11:18.978	\N	2025-07-10 02:11:18.986216	2025-07-10 02:11:18.986216
3e00e790-dc3f-4808-add2-4e2aa3fedbc7	jaja@mail.com	9d818f66-05e6-4f16-b086-b42a75477db4	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	member	\N	\N	62826e8d-6bf1-4c6f-948f-f82c6f43bd85	pending	2025-07-17 02:11:19.975	\N	2025-07-10 02:11:19.983271	2025-07-10 02:11:19.983271
6f9a4193-fc21-413e-8556-aac5137fc779	tata@mail.com	9d818f66-05e6-4f16-b086-b42a75477db4	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	member	\N	\N	afea5c1a-076a-4a37-8ccc-0ca24dbafb2d	pending	2025-07-17 02:11:20.937	\N	2025-07-10 02:11:20.94609	2025-07-10 02:11:20.94609
\.


--
-- TOC entry 3917 (class 0 OID 1024072)
-- Dependencies: 242
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, organization_id, type, title, message, entity_type, entity_id, entity_title, actor_id, is_read, read_at, metadata, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3895 (class 0 OID 81964)
-- Dependencies: 220
-- Data for Name: objectives; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.objectives (id, cycle_id, title, description, owner, owner_type, owner_id, status, team_id, parent_id) FROM stdin;
3fe7b8fc-9bed-41ee-9d0d-935f34b3c7f6	d9294c13-41bf-405c-a287-48a45370feff	Improve System Performance	Optimize application performance and reduce response times	Engineering Team	team	c39f6983-ea07-4071-9f1c-a6b996b32475	on_track	c39f6983-ea07-4071-9f1c-a6b996b32475	\N
66f27cfe-f21f-4616-8202-e4e24e235e0b	d9294c13-41bf-405c-a287-48a45370feff	Enhance User Experience	Improve user interface and user experience across the platform	Product Team	user	84b1a833-3fee-4417-b4f3-8843b9e3cd92	not_started	\N	\N
abb6be85-cb01-4e10-bd84-5375cc7eb0c4	363af44f-d89f-4097-9be6-62684e8dc81f	Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan	Objective pertama dari hasil onboarding (penjualan)	nana	user	b7dd3960-5a94-42e5-8415-3f5088452ec6	not_started	\N	\N
c0ac3e20-32ee-4d02-8cf5-b158e1652a6b	363af44f-d89f-4097-9be6-62684e8dc81f	Meningkatkan penjualan Q1 2025	Objective pertama dari hasil onboarding (penjualan)	nana	user	b7dd3960-5a94-42e5-8415-3f5088452ec6	not_started	\N	\N
1e77e3cb-3944-41a8-b7be-fa50bd397ff5	363af44f-d89f-4097-9be6-62684e8dc81f	Meningkatkan penjualan Q1 2025	Objective pertama dari hasil onboarding (penjualan)	nana	user	b7dd3960-5a94-42e5-8415-3f5088452ec6	not_started	\N	\N
083f9717-08ed-4fa8-86a0-ec03e91f5b64	363af44f-d89f-4097-9be6-62684e8dc81f	Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan	Objective pertama dari hasil onboarding (penjualan)	asd	user	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	not_started	\N	\N
cfe90273-d75f-45a4-b2e7-858da89d636f	363af44f-d89f-4097-9be6-62684e8dc81f	Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan	Objective pertama dari hasil onboarding (penjualan)	rara	user	72279bc5-a4ce-40b7-af12-52a9dbeacfde	not_started	\N	\N
d19cc8dd-6ea9-4bb7-94ee-0c02a0b399ac	363af44f-d89f-4097-9be6-62684e8dc81f	Test Objective untuk Random Deadline	Objective pertama dari hasil onboarding (penjualan)	rara	user	72279bc5-a4ce-40b7-af12-52a9dbeacfde	not_started	\N	\N
884bfc71-6ac7-4f31-82b8-65740de713d7	363af44f-d89f-4097-9be6-62684e8dc81f	Test Objective untuk Random Deadline	Objective pertama dari hasil onboarding (penjualan)	rara	user	72279bc5-a4ce-40b7-af12-52a9dbeacfde	not_started	\N	\N
cc2c92cd-983c-4b3e-a6d4-4c515b30347e	363af44f-d89f-4097-9be6-62684e8dc81f	Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan	Objective pertama dari hasil onboarding (penjualan)	jojo	user	ff1f458e-af29-4b1b-aa16-2e6b32833e6a	not_started	\N	\N
07b53487-696c-45d4-ae4b-5c5dea9022ba	363af44f-d89f-4097-9be6-62684e8dc81f	Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan	Objective pertama dari hasil onboarding (penjualan)	mimi	user	955b3705-14e4-4fd7-afa0-47d8e2475edf	not_started	\N	\N
\.


--
-- TOC entry 3925 (class 0 OID 1384536)
-- Dependencies: 250
-- Data for Name: organization_add_on_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organization_add_on_subscriptions (id, organization_id, add_on_id, quantity, billing_period_id, status, current_period_start, current_period_end, cancelled_at, stripe_subscription_item_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3914 (class 0 OID 204825)
-- Dependencies: 239
-- Data for Name: organization_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organization_subscriptions (id, organization_id, plan_id, status, current_period_start, current_period_end, cancel_at, cancelled_at, trial_start, trial_end, stripe_subscription_id, stripe_customer_id, metadata, created_at, updated_at) FROM stdin;
687bd340-c85b-49a9-9343-14fc3d42c628	d34a8b3f-9fbd-409e-a077-72bbfd8c4e42	0c68af8a-6356-47f3-a7ef-b59411815756	active	2025-07-09 17:17:13.422	2025-10-07 17:17:13.422	\N	\N	\N	\N	\N	\N	\N	2025-07-09 17:17:13.433672	2025-07-09 17:17:13.433672
16a9eb7e-84b1-4d6d-aca1-7603138b9124	0f4bbfa3-10ca-426a-8f6d-97b5e26d30c9	f844f00f-a4c3-4c05-a779-a4ad36cd4662	active	2025-07-09 17:17:13.422	2025-08-08 17:17:13.422	\N	\N	\N	\N	\N	\N	\N	2025-07-09 17:17:13.433672	2025-07-09 17:17:13.433672
a792ab9a-2f3f-4437-a1cb-80cf92ff5ae8	ee1e567a-3857-4026-8359-ee755d4e83cf	b30e1589-0ef6-4cb6-86b3-8aba177ac82d	active	2025-07-09 17:17:13.422	2026-07-09 17:17:13.422	\N	\N	\N	\N	\N	\N	\N	2025-07-09 17:17:13.433672	2025-07-09 17:17:13.433672
\.


--
-- TOC entry 3913 (class 0 OID 204813)
-- Dependencies: 238
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, name, slug, logo, website, industry, size, created_at, updated_at, owner_id, registration_status, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, is_active, onboarding_completed, onboarding_completed_at, onboarding_data) FROM stdin;
d34a8b3f-9fbd-409e-a077-72bbfd8c4e42	PT Teknologi Maju	teknologi-maju	\N	https://teknologimaju.co.id	Technology	11-50	2025-07-09 17:17:13.404708	2025-07-09 17:17:13.404708	\N	pending	\N	\N	\N	\N	\N	t	f	\N	\N
0f4bbfa3-10ca-426a-8f6d-97b5e26d30c9	CV Kreatif Indonesia	kreatif-indonesia	\N	https://kreatifindonesia.id	Creative Agency	1-10	2025-07-09 17:17:13.404708	2025-07-09 17:17:13.404708	\N	pending	\N	\N	\N	\N	\N	t	f	\N	\N
ee1e567a-3857-4026-8359-ee755d4e83cf	PT Solusi Digital	solusi-digital	\N	https://solusidigital.com	Software Development	51-200	2025-07-09 17:17:13.404708	2025-07-09 17:17:13.404708	\N	pending	\N	\N	\N	\N	\N	t	f	\N	\N
918dec0c-6672-4533-8e6c-6532fbfeabf9	Jujura	jujura	\N	\N	other	1-10	2025-07-09 17:20:34.701	2025-07-09 17:20:34.701	53722784-a50a-4f6e-8ae5-63a863364f36	pending	\N	\N	\N	\N	\N	t	f	\N	\N
489ca492-37aa-4b7f-90ee-509ae24cf13c	asdas	asdas	\N	\N	other	1-10	2025-07-09 17:22:12.446	2025-07-09 17:22:12.446	64ed6ae1-0961-43b0-b6ae-9b01823784e6	pending	\N	\N	\N	\N	\N	t	f	\N	\N
9fcf4dcd-7cd8-4a3c-813c-8efaebe341c4	Test Business	test-business	\N	\N	other	1-10	2025-07-09 18:13:14.214	2025-07-09 18:13:14.214	2c62c655-0b36-47b0-9754-4bc99e2553ed	pending	\N	\N	\N	\N	\N	t	f	\N	\N
003b9e19-92f7-4c3d-98f1-a3d597a3563e	nana	nana	\N	\N	other	1-10	2025-07-09 18:18:26.472	2025-07-09 18:35:15.88	b7dd3960-5a94-42e5-8415-3f5088452ec6	pending	\N	\N	\N	\N	\N	t	t	2025-07-09 18:35:15.88	{"tasks": ["Buat creative design untuk promosi diskon", "Setup campaign di Facebook Ads dan Google Ads", "Buat materi training closing technique", "Tentukan harga bundling yang kompetitif"], "cadence": "harian", "objective": "Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan", "teamFocus": "penjualan", "keyResults": ["Mencapai target penjualan Rp 500 juta per bulan", "Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta"], "currentStep": 10, "initiatives": ["Menjalankan kampanye promosi bulanan dengan diskon 20%", "Melatih sales team untuk closing technique", "Membuat program bundling produk dengan harga spesial"], "isCompleted": false, "reminderDay": "", "cycleEndDate": "2025-07-31", "firstCheckIn": "", "reminderDate": "", "reminderTime": "17:00", "cycleDuration": "1_bulan", "completedSteps": [1, 2, 3, 4, 5, 6, 7, 8, 9], "cycleStartDate": "2025-07-10", "invitedMembers": ["asdna@mail.com", "ajaj@mail.com"]}
9d818f66-05e6-4f16-b086-b42a75477db4	ads	ads	\N	\N	other	1-10	2025-07-09 18:28:43.73	2025-07-10 02:11:21.919	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	pending	\N	\N	\N	\N	\N	t	t	2025-07-10 02:11:21.919	{"tasks": ["Buat creative design untuk promosi diskon", "Setup campaign di Facebook Ads dan Google Ads", "Jadwalkan session training dengan sales team", "Buat materi training closing technique", "Analisis produk yang cocok untuk bundling", "Tentukan harga bundling yang kompetitif"], "cadence": "harian", "objective": "Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan", "teamFocus": "penjualan", "keyResults": ["Mencapai target penjualan Rp 500 juta per bulan", "Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta"], "currentStep": 9, "initiatives": ["Menjalankan kampanye promosi bulanan dengan diskon 20%", "Melatih sales team untuk closing technique", "Membuat program bundling produk dengan harga spesial"], "isCompleted": false, "reminderDay": "", "cycleEndDate": "2025-07-24", "firstCheckIn": "", "reminderDate": "", "reminderTime": "17:00", "cycleDuration": "1_bulan", "completedSteps": [1, 2, 3, 4, 5, 6, 7, 8], "cycleStartDate": "2025-07-01", "invitedMembers": ["nana@mail.com", "jaja@mail.com", "tata@mail.com"]}
1b81671d-6714-4a30-af61-25df13f59947	rara	rara	\N	\N	other	1-10	2025-07-10 02:25:34.707	2025-07-10 04:14:13.781	72279bc5-a4ce-40b7-af12-52a9dbeacfde	pending	\N	\N	\N	\N	\N	t	t	2025-07-10 04:14:13.781	{"tasks": ["Buat creative design untuk promosi diskon", "Setup campaign di Facebook Ads dan Google Ads"], "cadence": "harian", "objective": "Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan", "teamFocus": "penjualan", "keyResults": ["Mencapai target penjualan Rp 500 juta per bulan", "Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta"], "currentStep": 9, "initiatives": ["Menjalankan kampanye promosi bulanan dengan diskon 20%", "Melatih sales team untuk closing technique", "Membuat program bundling produk dengan harga spesial"], "isCompleted": false, "reminderDay": "", "cycleEndDate": "2025-08-02", "firstCheckIn": "", "reminderDate": "", "reminderTime": "17:00", "cycleDuration": "1_bulan", "completedSteps": [1, 2, 3, 4, 5, 6, 7, 8], "cycleStartDate": "2025-07-31", "invitedMembers": []}
bc5af273-e81b-49af-a156-77bbcce629f9	Refokus System	refokus-system	\N	https://refokus.com	Technology	1-10	2025-07-10 07:08:27.908881	2025-07-10 07:08:27.908881	2a3a5347-782e-4cfe-9d30-83c8905a42f7	pending	\N	\N	\N	\N	\N	t	f	\N	\N
0b91d0b5-3402-46b4-a3e4-0d8803ac28f2	jojo	jojo	\N	\N	other	1-10	2025-07-10 04:36:48.758	2025-07-10 05:07:24.586	ff1f458e-af29-4b1b-aa16-2e6b32833e6a	pending	\N	\N	\N	\N	\N	t	t	2025-07-10 05:07:24.586	{"tasks": ["Buat creative design untuk promosi diskon", "Setup campaign di Facebook Ads dan Google Ads", "Siapkan landing page untuk campaign"], "cadence": "harian", "objective": "Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan", "teamFocus": "penjualan", "keyResults": ["Mencapai target penjualan Rp 500 juta per bulan"], "currentStep": 9, "initiatives": ["Menjalankan kampanye promosi bulanan dengan diskon 20%"], "isCompleted": false, "reminderDay": "", "cycleEndDate": "2025-11-30", "firstCheckIn": "", "reminderDate": "", "reminderTime": "17:00", "cycleDuration": "6_bulan", "completedSteps": [1, 2, 3, 3, 4, 5, 6, 7, 8], "cycleStartDate": "2025-07-01", "invitedMembers": []}
76ce4cb4-12de-462e-ba5c-ff96365dc234	System Admin Organization	system-admin-org	\N	https://system.com	Technology	1-10	2025-07-10 07:08:55.9905	2025-07-10 07:08:55.9905	1c098d4e-ad98-4c78-9f10-a763d89ab1c8	pending	\N	\N	\N	\N	\N	t	f	\N	\N
300f8a88-1291-492d-bbb3-92db2bb89258	mimi	mimi	\N	\N	other	1-10	2025-07-10 05:11:23.101	2025-07-10 05:28:49.163	955b3705-14e4-4fd7-afa0-47d8e2475edf	pending	\N	\N	\N	\N	\N	t	t	2025-07-10 05:28:49.163	{"tasks": ["Buat creative design untuk promosi diskon", "Analisis produk yang cocok untuk bundling"], "cadence": "harian", "objective": "Menciptakan pertumbuhan penjualan yang berkelanjutan dan signifikan", "teamFocus": "penjualan", "keyResults": ["Mencapai target penjualan Rp 500 juta per bulan", "Meningkatkan rata-rata nilai transaksi menjadi Rp 2 juta"], "currentStep": 9, "initiatives": ["Menjalankan kampanye promosi bulanan dengan diskon 20%", "Membuat program bundling produk dengan harga spesial"], "isCompleted": false, "reminderDay": "", "cycleEndDate": "2025-08-31", "firstCheckIn": "", "reminderDate": "", "reminderTime": "17:00", "cycleDuration": "3_bulan", "completedSteps": [1, 2, 3, 4, 5, 6, 7, 8], "cycleStartDate": "2025-07-01", "invitedMembers": []}
\.


--
-- TOC entry 3919 (class 0 OID 1073176)
-- Dependencies: 244
-- Data for Name: role_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_templates (id, name, description, permissions, organization_id, is_system, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3890 (class 0 OID 24609)
-- Dependencies: 215
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (sid, sess, expire) FROM stdin;
XSi37r8GXacjuBg_h4XaoYjd3qxAsQht	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-08T18:16:07.485Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 2592000000}, "userId": "64ed6ae1-0961-43b0-b6ae-9b01823784e6"}	2025-08-08 18:16:08
4-pecfNAFsIHkwHETUoHvMwVqsC0FJUe	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-08T18:24:12.688Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 2592000000}, "userId": "b7dd3960-5a94-42e5-8415-3f5088452ec6"}	2025-08-08 18:24:13
w7G1CL6RM0jCPvPe0VUM47zM8JVEQ2kE	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-08T18:24:30.443Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 2592000000}, "userId": "b7dd3960-5a94-42e5-8415-3f5088452ec6"}	2025-08-08 18:35:16
8-XD9nJhJn_1B98LgSGYUjwYbkc2sxPY	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-09T08:03:52.590Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 2592000000}, "userId": "2a3a5347-782e-4cfe-9d30-83c8905a42f7"}	2025-08-09 08:03:53
Q3yjstvBLgqWs7unR5JVVtl08swLai9s	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-09T07:09:33.801Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 2592000000}, "userId": "1c098d4e-ad98-4c78-9f10-a763d89ab1c8"}	2025-08-09 08:22:58
on6BxZ3_djWwHLrBoRfmOu_b-3Zj19p1	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-09T08:02:34.206Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 2592000000}, "userId": "2a3a5347-782e-4cfe-9d30-83c8905a42f7"}	2025-08-09 08:02:35
dFOoxybG16MXUSt60N1IXjKZvo-P391H	{"cookie": {"path": "/", "secure": false, "expires": "2025-08-08T18:22:14.279Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 2592000000}, "userId": "b7dd3960-5a94-42e5-8415-3f5088452ec6"}	2025-08-08 18:22:15
\.


--
-- TOC entry 3924 (class 0 OID 1368130)
-- Dependencies: 249
-- Data for Name: subscription_add_ons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_add_ons (id, name, slug, description, price, type, stripe_price_id, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3912 (class 0 OID 204800)
-- Dependencies: 237
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_plans (id, name, slug, price, max_users, features, stripe_product_id, stripe_price_id, is_active, created_at, updated_at) FROM stdin;
f844f00f-a4c3-4c05-a779-a4ad36cd4662	Starter	starter	99000.00	3	"[\\"Hingga 3 pengguna\\",\\"OKR Unlimited\\",\\"Tracking & Monitoring\\",\\"Dashboard Analytics\\",\\"Email Support\\"]"	\N	\N	t	2025-07-09 17:17:13.350658	2025-07-09 17:17:13.350658
0c68af8a-6356-47f3-a7ef-b59411815756	Tim 10 (Growth)	growth	299000.00	10	"[\\"Hingga 10 pengguna\\",\\"Semua fitur Starter\\",\\"Team Collaboration\\",\\"Advanced Analytics\\",\\"Priority Support\\",\\"Custom Branding\\"]"	\N	\N	t	2025-07-09 17:17:13.350658	2025-07-09 17:17:13.350658
b30e1589-0ef6-4cb6-86b3-8aba177ac82d	Tim 25 (Scale)	scale	749000.00	25	"[\\"Hingga 25 pengguna\\",\\"Semua fitur Growth\\",\\"API Access\\",\\"Advanced Integrations\\",\\"Dedicated Support\\",\\"Custom Reports\\",\\"Multi-team Management\\"]"	\N	\N	t	2025-07-09 17:17:13.350658	2025-07-09 17:17:13.350658
13d96188-0dae-4157-a6c5-ea49609534ed	Enterprise	enterprise	0.00	\N	"[\\"Unlimited pengguna\\",\\"Semua fitur Scale\\",\\"SSO/SAML\\",\\"Custom Integrations\\",\\"Dedicated Account Manager\\",\\"SLA Guarantee\\",\\"On-premise option\\",\\"Custom Training\\"]"	\N	\N	t	2025-07-09 17:17:13.350658	2025-07-09 17:17:13.350658
\.


--
-- TOC entry 3911 (class 0 OID 188433)
-- Dependencies: 236
-- Data for Name: success_metric_updates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.success_metric_updates (id, metric_id, achievement, notes, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 3930 (class 0 OID 1679626)
-- Dependencies: 255
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, setting_key, setting_value, description, category, is_active, created_at, updated_at) FROM stdin;
ea2722a4-f646-4ce6-bf9b-9b817f500e30	email_provider	mailtrap	Default Email Provider	email	t	2025-07-09 13:00:25.283996	2025-07-09 13:00:25.283996
d99e7507-e2c7-48ff-95cb-82c42d4588bd	mailtrap_port	2525	Mailtrap SMTP Port	email	t	2025-07-09 13:00:25.283996	2025-07-10 07:12:16.117
23801591-77af-4828-9b39-544e4592cda2	mailtrap_user	smtp@mailtrap.io	Mailtrap Username	email	t	2025-07-09 13:00:25.283996	2025-07-10 07:12:16.136
cdaca3ce-0bbc-48c5-a68b-65d5f7743486	mailtrap_pass	dc1ce49130cb8984adb50f5d0ea63883	Mailtrap Password	email	t	2025-07-09 13:00:25.283996	2025-07-10 07:12:16.155
51b2f66e-9db7-4c5b-973b-6d17d0c15523	mailtrap_from	noreply@refokus.id	Mailtrap From Email	email	t	2025-07-09 13:00:25.283996	2025-07-10 07:12:16.172
a33c29fe-1b9c-44ec-96a8-ee9c7b2c63d2	sendgrid_api_key		SendGrid API Key	email	t	2025-07-09 13:03:49.214435	2025-07-10 07:12:16.195
320b6b6e-49e2-4c87-af22-f47bb8bfe853	sendgrid_from	noreply@platformokr.com	SendGrid From Email	email	t	2025-07-09 13:03:49.214435	2025-07-10 07:12:16.213
b4525af1-444b-471c-91f5-f6979d69397d	gmail_user		Gmail Username	email	t	2025-07-09 13:03:49.214435	2025-07-10 07:12:16.232
13ca991c-85e9-4333-a7dc-ed834045bbc5	gmail_pass		Gmail Password/App Password	email	t	2025-07-09 13:03:49.214435	2025-07-10 07:12:16.254
2189f48f-3de0-4863-bfb6-3b5f48d9c001	gmail_from	noreply@platformokr.com	Gmail From Email	email	t	2025-07-09 13:03:49.214435	2025-07-10 07:12:16.273
26ab13a2-191b-4ea2-87ae-d87852c3bdbd	smtp_host	smtp.gmail.com	SMTP Host	email	t	2025-07-09 13:03:49.214435	2025-07-10 07:12:16.292
3b6378ca-5a27-4779-a551-c9a046c95aa9	smtp_port	587	SMTP Port	email	t	2025-07-09 13:03:49.214435	2025-07-10 07:12:16.311
e925a045-0a41-4ac8-bb99-f491c7669a5d	smtp_user		SMTP Username	email	t	2025-07-09 13:03:49.214435	2025-07-10 07:12:16.332
4c91c867-1801-47bb-810c-49c739bfc6c0	smtp_pass		SMTP Password	email	t	2025-07-09 13:03:49.214435	2025-07-10 07:12:16.352
27718bdc-d0b2-4a9c-8292-e5b172e16603	smtp_secure	false	SMTP Secure Connection	email	t	2025-07-09 13:03:49.214435	2025-07-10 07:12:16.37
994624d2-5e51-4cb1-8b4d-7d86f7beaeda	smtp_from	noreply@platformokr.com	SMTP From Email	email	t	2025-07-09 13:03:49.214435	2025-07-10 07:12:16.39
a904a992-b51b-43b9-8461-4c9b57744255	mailtrap_host	live.smtp.mailtrap.io	Mailtrap SMTP Host	email	t	2025-07-09 13:00:25.283996	2025-07-10 07:12:16.407
\.


--
-- TOC entry 3916 (class 0 OID 917504)
-- Dependencies: 241
-- Data for Name: task_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_comments (id, task_id, user_id, content, mentioned_users, is_edited, edited_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3896 (class 0 OID 81974)
-- Dependencies: 221
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, initiative_id, title, description, status, priority, assigned_to, due_date, completed_at, created_at, created_by) FROM stdin;
0e1cf637-f7dc-42e2-b5ec-2eb266f05e76	be927fb7-b367-482e-8663-a958811d58ee	Buat creative design untuk promosi diskon	Task dari hasil onboarding	not_started	medium	b7dd3960-5a94-42e5-8415-3f5088452ec6	\N	\N	2025-07-09 18:26:58.003555	b7dd3960-5a94-42e5-8415-3f5088452ec6
0aac012e-bb48-4ff6-9da2-9a10a82fd32d	be927fb7-b367-482e-8663-a958811d58ee	Setup campaign di Facebook Ads dan Google Ads	Task dari hasil onboarding	not_started	medium	b7dd3960-5a94-42e5-8415-3f5088452ec6	\N	\N	2025-07-09 18:26:58.003555	b7dd3960-5a94-42e5-8415-3f5088452ec6
de6fc226-9aca-4cb1-acb4-172a5b68f6bf	be927fb7-b367-482e-8663-a958811d58ee	Buat materi training closing technique	Task dari hasil onboarding	not_started	medium	b7dd3960-5a94-42e5-8415-3f5088452ec6	\N	\N	2025-07-09 18:26:58.003555	b7dd3960-5a94-42e5-8415-3f5088452ec6
2097f65e-0616-453c-b7b0-ca5d29512538	be927fb7-b367-482e-8663-a958811d58ee	Tentukan harga bundling yang kompetitif	Task dari hasil onboarding	not_started	medium	b7dd3960-5a94-42e5-8415-3f5088452ec6	\N	\N	2025-07-09 18:26:58.003555	b7dd3960-5a94-42e5-8415-3f5088452ec6
ddbc2aaa-9e18-4c8e-a00f-bbbf03272db6	10348f0a-50a0-4b73-962f-0b3e13ba0b47	Buat creative design untuk promosi diskon	Task dari hasil onboarding	not_started	medium	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	\N	\N	2025-07-10 02:11:18.965545	ff7372d7-0c07-40b3-a76a-7c745b89f7a5
81947b6d-3ead-4bca-ad35-f9259afa89f0	10348f0a-50a0-4b73-962f-0b3e13ba0b47	Setup campaign di Facebook Ads dan Google Ads	Task dari hasil onboarding	not_started	medium	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	\N	\N	2025-07-10 02:11:18.965545	ff7372d7-0c07-40b3-a76a-7c745b89f7a5
63b52944-21be-4a42-a910-4a3165d654bf	10348f0a-50a0-4b73-962f-0b3e13ba0b47	Jadwalkan session training dengan sales team	Task dari hasil onboarding	not_started	medium	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	\N	\N	2025-07-10 02:11:18.965545	ff7372d7-0c07-40b3-a76a-7c745b89f7a5
97d697cb-850a-468c-8eed-abc85994a17d	10348f0a-50a0-4b73-962f-0b3e13ba0b47	Buat materi training closing technique	Task dari hasil onboarding	not_started	medium	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	\N	\N	2025-07-10 02:11:18.965545	ff7372d7-0c07-40b3-a76a-7c745b89f7a5
d5953351-46e6-4d8b-922b-ffecfa6fb78f	10348f0a-50a0-4b73-962f-0b3e13ba0b47	Analisis produk yang cocok untuk bundling	Task dari hasil onboarding	not_started	medium	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	\N	\N	2025-07-10 02:11:18.965545	ff7372d7-0c07-40b3-a76a-7c745b89f7a5
cf884c9d-7f5f-4ba1-96bb-c4f5a0093df6	10348f0a-50a0-4b73-962f-0b3e13ba0b47	Tentukan harga bundling yang kompetitif	Task dari hasil onboarding	not_started	medium	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	\N	\N	2025-07-10 02:11:18.965545	ff7372d7-0c07-40b3-a76a-7c745b89f7a5
6816877e-2396-42f4-a94a-d393e1902773	bf884146-c37c-486b-be45-e41563fc5681	Buat creative design untuk promosi diskon	Task dari hasil onboarding	not_started	medium	72279bc5-a4ce-40b7-af12-52a9dbeacfde	\N	\N	2025-07-10 04:14:13.7501	72279bc5-a4ce-40b7-af12-52a9dbeacfde
70442189-125f-4516-bda0-2742e3d52de9	bf884146-c37c-486b-be45-e41563fc5681	Setup campaign di Facebook Ads dan Google Ads	Task dari hasil onboarding	not_started	medium	72279bc5-a4ce-40b7-af12-52a9dbeacfde	\N	\N	2025-07-10 04:14:13.7501	72279bc5-a4ce-40b7-af12-52a9dbeacfde
13cea605-5173-43dc-a5ae-075dd6bd7f56	2cda9c5d-9328-4b3a-ae8f-0a9dba96f0c0	Buat creative design untuk promosi diskon	Task dari hasil onboarding	not_started	medium	72279bc5-a4ce-40b7-af12-52a9dbeacfde	2025-08-01 23:31:27.725	\N	2025-07-10 04:22:08.345456	72279bc5-a4ce-40b7-af12-52a9dbeacfde
9d9a6764-2be0-43a5-9b1e-95a6ffa52c60	2cda9c5d-9328-4b3a-ae8f-0a9dba96f0c0	Setup campaign di Facebook Ads dan Google Ads	Task dari hasil onboarding	not_started	medium	72279bc5-a4ce-40b7-af12-52a9dbeacfde	2025-07-31 23:34:54.966	\N	2025-07-10 04:22:08.345456	72279bc5-a4ce-40b7-af12-52a9dbeacfde
9ed2ed54-3006-4c35-9dd1-1ab51655e809	2cda9c5d-9328-4b3a-ae8f-0a9dba96f0c0	Buat materi training untuk sales team	Task dari hasil onboarding	not_started	medium	72279bc5-a4ce-40b7-af12-52a9dbeacfde	2025-08-01 20:14:28.388	\N	2025-07-10 04:22:08.345456	72279bc5-a4ce-40b7-af12-52a9dbeacfde
3fc10e42-60d5-4e44-bce3-5698b6f39f15	6cf5b726-966c-48a6-88d6-6c12f4630c7a	Buat creative design untuk promosi diskon	Task dari hasil onboarding	not_started	medium	72279bc5-a4ce-40b7-af12-52a9dbeacfde	2025-08-01 14:07:48.197	\N	2025-07-10 04:23:00.759653	72279bc5-a4ce-40b7-af12-52a9dbeacfde
dc2463fe-321d-42ea-b0d5-f183ec886c39	6cf5b726-966c-48a6-88d6-6c12f4630c7a	Setup campaign di Facebook Ads dan Google Ads	Task dari hasil onboarding	not_started	medium	72279bc5-a4ce-40b7-af12-52a9dbeacfde	2025-07-31 02:55:31.544	\N	2025-07-10 04:23:00.759653	72279bc5-a4ce-40b7-af12-52a9dbeacfde
24efc0f6-5ed9-4213-a826-87fa0f8d7cb9	6cf5b726-966c-48a6-88d6-6c12f4630c7a	Buat materi training untuk sales team	Task dari hasil onboarding	not_started	medium	72279bc5-a4ce-40b7-af12-52a9dbeacfde	2025-08-01 16:03:15.764	\N	2025-07-10 04:23:00.759653	72279bc5-a4ce-40b7-af12-52a9dbeacfde
b4d18b24-4470-4a2a-85bf-3a4de5787a14	31acc666-f442-4c8f-aa7d-15a45901d6a1	Buat creative design untuk promosi diskon	Task dari hasil onboarding	not_started	medium	ff1f458e-af29-4b1b-aa16-2e6b32833e6a	2025-10-18 07:04:57.722	\N	2025-07-10 05:07:24.556923	ff1f458e-af29-4b1b-aa16-2e6b32833e6a
87b81177-d9da-410b-aa4e-0bbd8c8503d3	31acc666-f442-4c8f-aa7d-15a45901d6a1	Setup campaign di Facebook Ads dan Google Ads	Task dari hasil onboarding	not_started	medium	ff1f458e-af29-4b1b-aa16-2e6b32833e6a	2025-07-26 14:54:22.745	\N	2025-07-10 05:07:24.556923	ff1f458e-af29-4b1b-aa16-2e6b32833e6a
cfde8400-ec26-439d-bd54-99fa7726429d	31acc666-f442-4c8f-aa7d-15a45901d6a1	Siapkan landing page untuk campaign	Task dari hasil onboarding	not_started	medium	ff1f458e-af29-4b1b-aa16-2e6b32833e6a	2025-10-09 23:32:50.198	\N	2025-07-10 05:07:24.556923	ff1f458e-af29-4b1b-aa16-2e6b32833e6a
4e756420-b7eb-4e33-a5fd-c6545b079528	8020c867-e0fe-4797-ae1a-3ac4bbfec977	Buat creative design untuk promosi diskon	Task dari hasil onboarding	not_started	medium	955b3705-14e4-4fd7-afa0-47d8e2475edf	2025-08-20 01:06:43.924	\N	2025-07-10 05:28:49.12944	955b3705-14e4-4fd7-afa0-47d8e2475edf
430a8cb6-108f-457a-ada7-a121212cdcc8	8020c867-e0fe-4797-ae1a-3ac4bbfec977	Analisis produk yang cocok untuk bundling	Task dari hasil onboarding	not_started	medium	955b3705-14e4-4fd7-afa0-47d8e2475edf	2025-08-12 17:16:00.393	\N	2025-07-10 05:28:49.12944	955b3705-14e4-4fd7-afa0-47d8e2475edf
\.


--
-- TOC entry 3897 (class 0 OID 81985)
-- Dependencies: 222
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_members (id, team_id, user_id, role, joined_at) FROM stdin;
35134053-c68d-4e47-b633-7e5380e167c9	c39f6983-ea07-4071-9f1c-a6b996b32475	84b1a833-3fee-4417-b4f3-8843b9e3cd92	admin	2025-07-09 17:17:07.944658
574c3883-b138-4d40-83d3-d366c7a8cdbb	c39f6983-ea07-4071-9f1c-a6b996b32475	d26cc3e4-1237-410b-abd3-44332b6c2897	member	2025-07-09 17:17:07.944658
\.


--
-- TOC entry 3898 (class 0 OID 81995)
-- Dependencies: 223
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, name, description, owner_id, created_at, updated_at, organization_id) FROM stdin;
c39f6983-ea07-4071-9f1c-a6b996b32475	Engineering Team	Core development team	5cb5c87c-384d-4c92-ad1f-15fe74a1702c	2025-07-09 17:17:07.91659	2025-07-09 17:17:07.91659	d34a8b3f-9fbd-409e-a077-72bbfd8c4e42
\.


--
-- TOC entry 3899 (class 0 OID 82005)
-- Dependencies: 224
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.templates (id, name, description, type, is_default, objectives) FROM stdin;
\.


--
-- TOC entry 3927 (class 0 OID 1499159)
-- Dependencies: 252
-- Data for Name: trial_achievements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trial_achievements (id, name, description, icon, category, points, trigger_type, trigger_condition, is_active, trial_only, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3929 (class 0 OID 1499191)
-- Dependencies: 254
-- Data for Name: trial_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trial_progress (id, user_id, organization_id, total_points, achievements_unlocked, current_streak, longest_streak, last_activity_date, progress_data, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3906 (class 0 OID 131104)
-- Dependencies: 231
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_achievements (id, user_id, achievement_id, unlocked_at, progress, is_completed) FROM stdin;
\.


--
-- TOC entry 3920 (class 0 OID 1073197)
-- Dependencies: 245
-- Data for Name: user_activity_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_activity_log (id, user_id, action, details, ip_address, user_agent, performed_by, created_at) FROM stdin;
\.


--
-- TOC entry 3926 (class 0 OID 1425649)
-- Dependencies: 251
-- Data for Name: user_onboarding_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_onboarding_progress (id, user_id, completed_tours, is_first_time_user, last_tour_started_at, created_at, updated_at, current_tour, current_step_index, welcome_wizard_completed) FROM stdin;
\.


--
-- TOC entry 3918 (class 0 OID 1073157)
-- Dependencies: 243
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_permissions (id, user_id, permission, resource, granted_by, granted_at, expires_at) FROM stdin;
\.


--
-- TOC entry 3907 (class 0 OID 131113)
-- Dependencies: 232
-- Data for Name: user_stats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_stats (id, user_id, total_points, level, current_streak, longest_streak, last_activity_date, objectives_completed, key_results_completed, check_ins_created, initiatives_created, collaboration_score, updated_at) FROM stdin;
6b1e998a-82d8-487f-9416-8029082c7818	b7dd3960-5a94-42e5-8415-3f5088452ec6	0	1	0	0	2025-07-09	0	0	0	0	0	2025-07-09 18:19:11.15325
e37e688a-4699-44fb-ad75-cea051dcdb44	ff7372d7-0c07-40b3-a76a-7c745b89f7a5	0	1	0	0	2025-07-09	0	0	0	0	0	2025-07-09 18:30:11.881872
88523b34-49fd-4160-ba5a-990190151308	72279bc5-a4ce-40b7-af12-52a9dbeacfde	0	1	0	0	2025-07-10	0	0	0	0	0	2025-07-10 02:26:21.843112
6d192891-fd1f-4a36-b571-87ba99f1b7bc	ff1f458e-af29-4b1b-aa16-2e6b32833e6a	0	1	0	0	2025-07-10	0	0	0	0	0	2025-07-10 05:04:11.214653
6c7afbf7-15ee-41fe-a8d2-a0aacc51d088	955b3705-14e4-4fd7-afa0-47d8e2475edf	0	1	0	0	2025-07-10	0	0	0	0	0	2025-07-10 05:14:18.804057
2376ef26-07d2-4771-9ce4-6e4058f15b7f	64ed6ae1-0961-43b0-b6ae-9b01823784e6	0	1	0	0	2025-07-10	0	0	0	0	0	2025-07-10 05:55:13.288919
8b86a03e-7751-4557-91f3-8f43da6df055	1c098d4e-ad98-4c78-9f10-a763d89ab1c8	0	1	0	0	2025-07-10	0	0	0	0	0	2025-07-10 07:09:35.676654
\.


--
-- TOC entry 3928 (class 0 OID 1499172)
-- Dependencies: 253
-- Data for Name: user_trial_achievements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_trial_achievements (id, user_id, achievement_id, unlocked_at, points_earned, metadata) FROM stdin;
\.


--
-- TOC entry 3900 (class 0 OID 82014)
-- Dependencies: 225
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, first_name, last_name, profile_image_url, role, is_active, created_at, updated_at, organization_id, is_system_owner, department, job_title, last_login_at, invited_by, invited_at, reminder_config, phone, verification_code, verification_code_expiry, is_email_verified) FROM stdin;
5cb5c87c-384d-4c92-ad1f-15fe74a1702c	admin@example.com	$2b$12$rPhsoxHWgBdabXYp36hfA.E4x03qNvol91BAizDZV1YL1VQhe5Zc.	Admin	User	\N	admin	t	2025-07-09 17:17:07.880384	2025-07-09 17:17:07.880384	d34a8b3f-9fbd-409e-a077-72bbfd8c4e42	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
84b1a833-3fee-4417-b4f3-8843b9e3cd92	manager@example.com	$2b$12$rPhsoxHWgBdabXYp36hfA.E4x03qNvol91BAizDZV1YL1VQhe5Zc.	Manager	User	\N	manager	t	2025-07-09 17:17:07.880384	2025-07-09 17:17:07.880384	d34a8b3f-9fbd-409e-a077-72bbfd8c4e42	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
d26cc3e4-1237-410b-abd3-44332b6c2897	dev@example.com	$2b$12$rPhsoxHWgBdabXYp36hfA.E4x03qNvol91BAizDZV1YL1VQhe5Zc.	Developer	User	\N	member	t	2025-07-09 17:17:07.880384	2025-07-09 17:17:07.880384	d34a8b3f-9fbd-409e-a077-72bbfd8c4e42	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
550e8400-e29b-41d4-a716-446655440002	unverified@example.com	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdHYjUgCe	Unverified	User	\N	member	t	2025-07-09 17:18:08.493196	2025-07-09 17:18:08.493196	d34a8b3f-9fbd-409e-a077-72bbfd8c4e42	f	\N	\N	\N	\N	\N	\N	081234567892	789012	\N	f
550e8400-e29b-41d4-a716-446655440001	verified@example.com	$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdHYjUgCe	Verified	User	\N	member	t	2025-07-09 17:18:08.493196	2025-07-09 17:18:08.493196	d34a8b3f-9fbd-409e-a077-72bbfd8c4e42	f	\N	\N	\N	\N	\N	\N	081234567891	\N	\N	t
53722784-a50a-4f6e-8ae5-63a863364f36	ini.indonesia1@gmail.com	$2b$12$27el6GCPu6piX.kZDxlk2OLh7xoKl3GeBhOfL221nKqTbTH2T3iNO	Widi		\N	organization_admin	t	2025-07-09 17:20:34.728	2025-07-09 17:20:58.492	918dec0c-6672-4533-8e6c-6532fbfeabf9	f	\N	\N	\N	\N	\N	\N	0896709453	\N	\N	f
ff7372d7-0c07-40b3-a76a-7c745b89f7a5	asd@mail.com	$2b$12$Ijs8wsIbWTLO7MAJs6sroe.AlFsNyMEa9ID9VxUU0ZDw.JmKo4pLC	asd		\N	organization_admin	t	2025-07-09 18:28:43.759	2025-07-09 18:29:43.29	9d818f66-05e6-4f16-b086-b42a75477db4	f	\N	\N	\N	\N	\N	"{\\"userId\\":\\"ff7372d7-0c07-40b3-a76a-7c745b89f7a5\\",\\"cadence\\":\\"harian\\",\\"reminderTime\\":\\"17:00\\",\\"reminderDay\\":\\"\\",\\"reminderDate\\":\\"\\",\\"isActive\\":true,\\"teamFocus\\":\\"penjualan\\"}"	089506840569409	\N	\N	t
550e8400-e29b-41d4-a716-446655440000	test@example.com	$2b$12$rPhsoxHWgBdabXYp36hfA.E4x03qNvol91BAizDZV1YL1VQhe5Zc.	Test	User	\N	organization_admin	t	2025-07-09 17:18:00.220449	2025-07-09 17:18:00.220449	d34a8b3f-9fbd-409e-a077-72bbfd8c4e42	f	\N	\N	\N	\N	\N	\N	081234567890	123456	\N	f
72279bc5-a4ce-40b7-af12-52a9dbeacfde	rara@mail.com	$2b$12$jFJHTUwkLvyKJhA6ZHykluNVL1rsj3kyEIPhEh95lHZeuKFxtFgCa	rara		\N	organization_admin	t	2025-07-10 02:25:34.725	2025-07-10 02:25:51.347	1b81671d-6714-4a30-af61-25df13f59947	f	\N	\N	\N	\N	\N	"{\\"userId\\":\\"72279bc5-a4ce-40b7-af12-52a9dbeacfde\\",\\"cadence\\":\\"harian\\",\\"reminderTime\\":\\"17:00\\",\\"reminderDay\\":\\"\\",\\"reminderDate\\":\\"\\",\\"isActive\\":true,\\"teamFocus\\":\\"penjualan\\"}"	0894507845907	\N	\N	t
2c62c655-0b36-47b0-9754-4bc99e2553ed	testuser@example.com	$2b$12$aFGdhM/jyStdvD4tdnT1teKIsRaK5TETqmhA8O6XCqFjrb.O97MhG	Test	User	\N	organization_admin	t	2025-07-09 18:13:14.241	2025-07-09 18:13:25.661	9fcf4dcd-7cd8-4a3c-813c-8efaebe341c4	f	\N	\N	\N	\N	\N	\N	081234567890	\N	\N	t
64ed6ae1-0961-43b0-b6ae-9b01823784e6	ada@mail.com	$2b$10$NjwXBCJq2CFenelxpmACXOU587Ypu/CbfVzc0BB7NZ7MmT96/yCJK	ananan		\N	organization_admin	t	2025-07-09 17:22:12.469	2025-07-09 18:15:38.258	489ca492-37aa-4b7f-90ee-509ae24cf13c	f	\N	\N	\N	\N	\N	\N	980654504	\N	\N	t
ff1f458e-af29-4b1b-aa16-2e6b32833e6a	jojo@mail.com	$2b$12$3FdrhdTXgAlzZ54xyCxOJupz2Kr220b7Kej49EGlqhBVp2rBOsrKm	jojo		\N	organization_admin	t	2025-07-10 04:36:48.781	2025-07-10 05:03:31.366	0b91d0b5-3402-46b4-a3e4-0d8803ac28f2	f	\N	\N	\N	\N	\N	"{\\"userId\\":\\"ff1f458e-af29-4b1b-aa16-2e6b32833e6a\\",\\"cadence\\":\\"harian\\",\\"reminderTime\\":\\"17:00\\",\\"reminderDay\\":\\"\\",\\"reminderDate\\":\\"\\",\\"isActive\\":true,\\"teamFocus\\":\\"penjualan\\"}"	089740574954	919359	2025-07-10 06:03:31.366	t
b7dd3960-5a94-42e5-8415-3f5088452ec6	nana@mail.com	$2b$10$IDW6GdyD0kcHkMwOtWyoEOHFYggypvO5Agq7a7w5RJH02wim9.evm	nana		\N	organization_admin	t	2025-07-09 18:18:26.495	2025-07-09 18:18:45.692	003b9e19-92f7-4c3d-98f1-a3d597a3563e	f	\N	\N	\N	\N	\N	"{\\"userId\\":\\"b7dd3960-5a94-42e5-8415-3f5088452ec6\\",\\"cadence\\":\\"weekly\\",\\"reminderTime\\":\\"09:00\\",\\"reminderDay\\":\\"monday\\",\\"isActive\\":true,\\"teamFocus\\":\\"penjualan\\"}"	092340990950	\N	\N	t
955b3705-14e4-4fd7-afa0-47d8e2475edf	mimi@mail.com	$2b$12$Z4EaEvUwoxOTO45LJTiYJu79Va8KJT4nqv70OUKOhO66oLSruSisC	mimi		\N	organization_admin	t	2025-07-10 05:11:23.124	2025-07-10 05:11:42.492	300f8a88-1291-492d-bbb3-92db2bb89258	f	\N	\N	\N	\N	\N	"{\\"userId\\":\\"955b3705-14e4-4fd7-afa0-47d8e2475edf\\",\\"cadence\\":\\"harian\\",\\"reminderTime\\":\\"17:00\\",\\"reminderDay\\":\\"\\",\\"reminderDate\\":\\"\\",\\"isActive\\":true,\\"teamFocus\\":\\"penjualan\\"}"	0890989090	\N	\N	t
2a3a5347-782e-4cfe-9d30-83c8905a42f7	admin@refokus.com	$2b$12$fOarFKlLizW0zgCERp8g9uIPUyNshTNDLIrB8HwEAXnxBneU66vyu	System	Administrator	\N	system_owner	t	2025-07-10 07:08:27.985209	2025-07-10 07:08:27.985209	bc5af273-e81b-49af-a156-77bbcce629f9	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	t
1c098d4e-ad98-4c78-9f10-a763d89ab1c8	owner@system.com	$2b$12$TSZn3mN2UeWJTudnoskjhuLBkYPLUrASdqCqaP95HKT28KjxvaDPm	System	Owner	\N	system_owner	t	2025-07-10 07:08:56.051808	2025-07-10 07:08:56.051808	76ce4cb4-12de-462e-ba5c-ff96365dc234	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	t
\.


--
-- TOC entry 3573 (class 2606 OID 131083)
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- TOC entry 3575 (class 2606 OID 131093)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3647 (class 2606 OID 1680790)
-- Name: application_settings application_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_settings
    ADD CONSTRAINT application_settings_key_key UNIQUE (key);


--
-- TOC entry 3649 (class 2606 OID 1680788)
-- Name: application_settings application_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_settings
    ADD CONSTRAINT application_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3618 (class 2606 OID 1343543)
-- Name: billing_periods billing_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_periods
    ADD CONSTRAINT billing_periods_pkey PRIMARY KEY (id);


--
-- TOC entry 3541 (class 2606 OID 81929)
-- Name: check_ins check_ins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT check_ins_pkey PRIMARY KEY (id);


--
-- TOC entry 3543 (class 2606 OID 81938)
-- Name: cycles cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycles
    ADD CONSTRAINT cycles_pkey PRIMARY KEY (id);


--
-- TOC entry 3605 (class 2606 OID 270367)
-- Name: daily_reflections daily_reflections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reflections
    ADD CONSTRAINT daily_reflections_pkey PRIMARY KEY (id);


--
-- TOC entry 3589 (class 2606 OID 155656)
-- Name: emoji_reactions emoji_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emoji_reactions
    ADD CONSTRAINT emoji_reactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3569 (class 2606 OID 114697)
-- Name: initiative_documents initiative_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_documents
    ADD CONSTRAINT initiative_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 3571 (class 2606 OID 114707)
-- Name: initiative_members initiative_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_members
    ADD CONSTRAINT initiative_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3587 (class 2606 OID 147466)
-- Name: initiative_notes initiative_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_notes
    ADD CONSTRAINT initiative_notes_pkey PRIMARY KEY (id);


--
-- TOC entry 3591 (class 2606 OID 188426)
-- Name: initiative_success_metrics initiative_success_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_success_metrics
    ADD CONSTRAINT initiative_success_metrics_pkey PRIMARY KEY (id);


--
-- TOC entry 3546 (class 2606 OID 81949)
-- Name: initiatives initiatives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiatives
    ADD CONSTRAINT initiatives_pkey PRIMARY KEY (id);


--
-- TOC entry 3624 (class 2606 OID 1359983)
-- Name: invoice_line_items invoice_line_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line_items
    ADD CONSTRAINT invoice_line_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3620 (class 2606 OID 1359947)
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- TOC entry 3622 (class 2606 OID 1359945)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 3549 (class 2606 OID 81963)
-- Name: key_results key_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_results
    ADD CONSTRAINT key_results_pkey PRIMARY KEY (id);


--
-- TOC entry 3577 (class 2606 OID 131103)
-- Name: level_rewards level_rewards_level_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.level_rewards
    ADD CONSTRAINT level_rewards_level_unique UNIQUE (level);


--
-- TOC entry 3579 (class 2606 OID 131101)
-- Name: level_rewards level_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.level_rewards
    ADD CONSTRAINT level_rewards_pkey PRIMARY KEY (id);


--
-- TOC entry 3654 (class 2606 OID 1681622)
-- Name: member_invitations member_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_invitations
    ADD CONSTRAINT member_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- TOC entry 3656 (class 2606 OID 1681620)
-- Name: member_invitations member_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_invitations
    ADD CONSTRAINT member_invitations_pkey PRIMARY KEY (id);


--
-- TOC entry 3610 (class 2606 OID 1024082)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3552 (class 2606 OID 81973)
-- Name: objectives objectives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.objectives
    ADD CONSTRAINT objectives_pkey PRIMARY KEY (id);


--
-- TOC entry 3630 (class 2606 OID 1384547)
-- Name: organization_add_on_subscriptions organization_add_on_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_add_on_subscriptions
    ADD CONSTRAINT organization_add_on_subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 3603 (class 2606 OID 204835)
-- Name: organization_subscriptions organization_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_subscriptions
    ADD CONSTRAINT organization_subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 3599 (class 2606 OID 204822)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- TOC entry 3601 (class 2606 OID 204824)
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- TOC entry 3614 (class 2606 OID 1073186)
-- Name: role_templates role_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_templates
    ADD CONSTRAINT role_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3539 (class 2606 OID 24615)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- TOC entry 3626 (class 2606 OID 1368140)
-- Name: subscription_add_ons subscription_add_ons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_add_ons
    ADD CONSTRAINT subscription_add_ons_pkey PRIMARY KEY (id);


--
-- TOC entry 3628 (class 2606 OID 1368142)
-- Name: subscription_add_ons subscription_add_ons_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_add_ons
    ADD CONSTRAINT subscription_add_ons_slug_key UNIQUE (slug);


--
-- TOC entry 3595 (class 2606 OID 204810)
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- TOC entry 3597 (class 2606 OID 204812)
-- Name: subscription_plans subscription_plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);


--
-- TOC entry 3593 (class 2606 OID 188441)
-- Name: success_metric_updates success_metric_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.success_metric_updates
    ADD CONSTRAINT success_metric_updates_pkey PRIMARY KEY (id);


--
-- TOC entry 3643 (class 2606 OID 1679637)
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3645 (class 2606 OID 1679639)
-- Name: system_settings system_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);


--
-- TOC entry 3608 (class 2606 OID 917515)
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 3555 (class 2606 OID 81984)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3557 (class 2606 OID 81994)
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3560 (class 2606 OID 82004)
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- TOC entry 3562 (class 2606 OID 82013)
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3637 (class 2606 OID 1499171)
-- Name: trial_achievements trial_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_achievements
    ADD CONSTRAINT trial_achievements_pkey PRIMARY KEY (id);


--
-- TOC entry 3641 (class 2606 OID 1499204)
-- Name: trial_progress trial_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_progress
    ADD CONSTRAINT trial_progress_pkey PRIMARY KEY (id);


--
-- TOC entry 3581 (class 2606 OID 131112)
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- TOC entry 3616 (class 2606 OID 1073205)
-- Name: user_activity_log user_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_pkey PRIMARY KEY (id);


--
-- TOC entry 3633 (class 2606 OID 1425661)
-- Name: user_onboarding_progress user_onboarding_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding_progress
    ADD CONSTRAINT user_onboarding_progress_pkey PRIMARY KEY (id);


--
-- TOC entry 3635 (class 2606 OID 1425663)
-- Name: user_onboarding_progress user_onboarding_progress_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding_progress
    ADD CONSTRAINT user_onboarding_progress_user_id_key UNIQUE (user_id);


--
-- TOC entry 3612 (class 2606 OID 1073165)
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3583 (class 2606 OID 131130)
-- Name: user_stats user_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_pkey PRIMARY KEY (id);


--
-- TOC entry 3585 (class 2606 OID 131132)
-- Name: user_stats user_stats_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_user_id_unique UNIQUE (user_id);


--
-- TOC entry 3639 (class 2606 OID 1499180)
-- Name: user_trial_achievements user_trial_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trial_achievements
    ADD CONSTRAINT user_trial_achievements_pkey PRIMARY KEY (id);


--
-- TOC entry 3565 (class 2606 OID 82027)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 3567 (class 2606 OID 82025)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3537 (class 1259 OID 24665)
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- TOC entry 3650 (class 1259 OID 1680791)
-- Name: idx_application_settings_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_settings_category ON public.application_settings USING btree (category);


--
-- TOC entry 3651 (class 1259 OID 1680792)
-- Name: idx_application_settings_is_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_settings_is_public ON public.application_settings USING btree (is_public);


--
-- TOC entry 3652 (class 1259 OID 1680793)
-- Name: idx_application_settings_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_application_settings_key ON public.application_settings USING btree (key);


--
-- TOC entry 3606 (class 1259 OID 270378)
-- Name: idx_daily_reflections_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_reflections_user_date ON public.daily_reflections USING btree (user_id, date);


--
-- TOC entry 3544 (class 1259 OID 229420)
-- Name: idx_initiatives_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_initiatives_created_by ON public.initiatives USING btree (created_by);


--
-- TOC entry 3547 (class 1259 OID 229419)
-- Name: idx_key_results_objective_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_key_results_objective_id ON public.key_results USING btree (objective_id);


--
-- TOC entry 3550 (class 1259 OID 229418)
-- Name: idx_objectives_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_objectives_owner_id ON public.objectives USING btree (owner_id);


--
-- TOC entry 3553 (class 1259 OID 229421)
-- Name: idx_tasks_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_created_by ON public.tasks USING btree (created_by);


--
-- TOC entry 3558 (class 1259 OID 229422)
-- Name: idx_teams_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_organization_id ON public.teams USING btree (organization_id);


--
-- TOC entry 3631 (class 1259 OID 1556575)
-- Name: idx_user_onboarding_progress_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_onboarding_progress_user_id ON public.user_onboarding_progress USING btree (user_id);


--
-- TOC entry 3563 (class 1259 OID 229417)
-- Name: idx_users_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_organization_id ON public.users USING btree (organization_id);


--
-- TOC entry 3672 (class 2606 OID 131133)
-- Name: activity_logs activity_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3699 (class 2606 OID 1343544)
-- Name: billing_periods billing_periods_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_periods
    ADD CONSTRAINT billing_periods_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- TOC entry 3657 (class 2606 OID 82028)
-- Name: check_ins check_ins_key_result_id_key_results_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.check_ins
    ADD CONSTRAINT check_ins_key_result_id_key_results_id_fk FOREIGN KEY (key_result_id) REFERENCES public.key_results(id);


--
-- TOC entry 3686 (class 2606 OID 270373)
-- Name: daily_reflections daily_reflections_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reflections
    ADD CONSTRAINT daily_reflections_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- TOC entry 3687 (class 2606 OID 270368)
-- Name: daily_reflections daily_reflections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reflections
    ADD CONSTRAINT daily_reflections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3678 (class 2606 OID 155657)
-- Name: emoji_reactions emoji_reactions_objective_id_objectives_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emoji_reactions
    ADD CONSTRAINT emoji_reactions_objective_id_objectives_id_fk FOREIGN KEY (objective_id) REFERENCES public.objectives(id) ON DELETE CASCADE;


--
-- TOC entry 3679 (class 2606 OID 155662)
-- Name: emoji_reactions emoji_reactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emoji_reactions
    ADD CONSTRAINT emoji_reactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3705 (class 2606 OID 1368143)
-- Name: invoice_line_items fk_invoice_line_items_add_on_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line_items
    ADD CONSTRAINT fk_invoice_line_items_add_on_id FOREIGN KEY (add_on_id) REFERENCES public.subscription_add_ons(id);


--
-- TOC entry 3716 (class 2606 OID 1681628)
-- Name: member_invitations fk_member_invitations_invited_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_invitations
    ADD CONSTRAINT fk_member_invitations_invited_by FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3717 (class 2606 OID 1681623)
-- Name: member_invitations fk_member_invitations_organization; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_invitations
    ADD CONSTRAINT fk_member_invitations_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 3668 (class 2606 OID 114710)
-- Name: initiative_documents initiative_documents_initiative_id_initiatives_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_documents
    ADD CONSTRAINT initiative_documents_initiative_id_initiatives_id_fk FOREIGN KEY (initiative_id) REFERENCES public.initiatives(id);


--
-- TOC entry 3669 (class 2606 OID 114715)
-- Name: initiative_documents initiative_documents_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_documents
    ADD CONSTRAINT initiative_documents_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- TOC entry 3670 (class 2606 OID 114720)
-- Name: initiative_members initiative_members_initiative_id_initiatives_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_members
    ADD CONSTRAINT initiative_members_initiative_id_initiatives_id_fk FOREIGN KEY (initiative_id) REFERENCES public.initiatives(id);


--
-- TOC entry 3671 (class 2606 OID 114725)
-- Name: initiative_members initiative_members_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_members
    ADD CONSTRAINT initiative_members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3676 (class 2606 OID 147472)
-- Name: initiative_notes initiative_notes_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_notes
    ADD CONSTRAINT initiative_notes_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3677 (class 2606 OID 147467)
-- Name: initiative_notes initiative_notes_initiative_id_initiatives_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_notes
    ADD CONSTRAINT initiative_notes_initiative_id_initiatives_id_fk FOREIGN KEY (initiative_id) REFERENCES public.initiatives(id);


--
-- TOC entry 3680 (class 2606 OID 188427)
-- Name: initiative_success_metrics initiative_success_metrics_initiative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiative_success_metrics
    ADD CONSTRAINT initiative_success_metrics_initiative_id_fkey FOREIGN KEY (initiative_id) REFERENCES public.initiatives(id);


--
-- TOC entry 3658 (class 2606 OID 196608)
-- Name: initiatives initiatives_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiatives
    ADD CONSTRAINT initiatives_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.users(id);


--
-- TOC entry 3659 (class 2606 OID 82033)
-- Name: initiatives initiatives_key_result_id_key_results_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiatives
    ADD CONSTRAINT initiatives_key_result_id_key_results_id_fk FOREIGN KEY (key_result_id) REFERENCES public.key_results(id);


--
-- TOC entry 3660 (class 2606 OID 114730)
-- Name: initiatives initiatives_pic_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.initiatives
    ADD CONSTRAINT initiatives_pic_id_users_id_fk FOREIGN KEY (pic_id) REFERENCES public.users(id);


--
-- TOC entry 3706 (class 2606 OID 1359984)
-- Name: invoice_line_items invoice_line_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line_items
    ADD CONSTRAINT invoice_line_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- TOC entry 3707 (class 2606 OID 1359989)
-- Name: invoice_line_items invoice_line_items_subscription_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_line_items
    ADD CONSTRAINT invoice_line_items_subscription_plan_id_fkey FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id);


--
-- TOC entry 3700 (class 2606 OID 1359958)
-- Name: invoices invoices_billing_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_billing_period_id_fkey FOREIGN KEY (billing_period_id) REFERENCES public.billing_periods(id);


--
-- TOC entry 3701 (class 2606 OID 1359968)
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3702 (class 2606 OID 1359948)
-- Name: invoices invoices_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- TOC entry 3703 (class 2606 OID 1359963)
-- Name: invoices invoices_organization_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_organization_subscription_id_fkey FOREIGN KEY (organization_subscription_id) REFERENCES public.organization_subscriptions(id);


--
-- TOC entry 3704 (class 2606 OID 1359953)
-- Name: invoices invoices_subscription_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_subscription_plan_id_fkey FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id);


--
-- TOC entry 3661 (class 2606 OID 163840)
-- Name: key_results key_results_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.key_results
    ADD CONSTRAINT key_results_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- TOC entry 3690 (class 2606 OID 1024093)
-- Name: notifications notifications_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- TOC entry 3691 (class 2606 OID 1024088)
-- Name: notifications notifications_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 3692 (class 2606 OID 1024083)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3662 (class 2606 OID 82038)
-- Name: objectives objectives_cycle_id_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.objectives
    ADD CONSTRAINT objectives_cycle_id_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.cycles(id);


--
-- TOC entry 3663 (class 2606 OID 82043)
-- Name: objectives objectives_team_id_teams_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.objectives
    ADD CONSTRAINT objectives_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- TOC entry 3708 (class 2606 OID 1384553)
-- Name: organization_add_on_subscriptions organization_add_on_subscriptions_add_on_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_add_on_subscriptions
    ADD CONSTRAINT organization_add_on_subscriptions_add_on_id_fkey FOREIGN KEY (add_on_id) REFERENCES public.subscription_add_ons(id);


--
-- TOC entry 3709 (class 2606 OID 1384558)
-- Name: organization_add_on_subscriptions organization_add_on_subscriptions_billing_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_add_on_subscriptions
    ADD CONSTRAINT organization_add_on_subscriptions_billing_period_id_fkey FOREIGN KEY (billing_period_id) REFERENCES public.billing_periods(id);


--
-- TOC entry 3710 (class 2606 OID 1384548)
-- Name: organization_add_on_subscriptions organization_add_on_subscriptions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_add_on_subscriptions
    ADD CONSTRAINT organization_add_on_subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- TOC entry 3684 (class 2606 OID 204836)
-- Name: organization_subscriptions organization_subscriptions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_subscriptions
    ADD CONSTRAINT organization_subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- TOC entry 3685 (class 2606 OID 204841)
-- Name: organization_subscriptions organization_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_subscriptions
    ADD CONSTRAINT organization_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- TOC entry 3682 (class 2606 OID 212992)
-- Name: organizations organizations_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- TOC entry 3683 (class 2606 OID 1228822)
-- Name: organizations organizations_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- TOC entry 3695 (class 2606 OID 1073192)
-- Name: role_templates role_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_templates
    ADD CONSTRAINT role_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3696 (class 2606 OID 1073187)
-- Name: role_templates role_templates_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_templates
    ADD CONSTRAINT role_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- TOC entry 3681 (class 2606 OID 188442)
-- Name: success_metric_updates success_metric_updates_metric_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.success_metric_updates
    ADD CONSTRAINT success_metric_updates_metric_id_fkey FOREIGN KEY (metric_id) REFERENCES public.initiative_success_metrics(id);


--
-- TOC entry 3688 (class 2606 OID 917516)
-- Name: task_comments task_comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- TOC entry 3689 (class 2606 OID 917521)
-- Name: task_comments task_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3664 (class 2606 OID 82048)
-- Name: tasks tasks_initiative_id_initiatives_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_initiative_id_initiatives_id_fk FOREIGN KEY (initiative_id) REFERENCES public.initiatives(id);


--
-- TOC entry 3665 (class 2606 OID 204851)
-- Name: teams teams_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- TOC entry 3714 (class 2606 OID 1499210)
-- Name: trial_progress trial_progress_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_progress
    ADD CONSTRAINT trial_progress_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 3715 (class 2606 OID 1499205)
-- Name: trial_progress trial_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_progress
    ADD CONSTRAINT trial_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3673 (class 2606 OID 131143)
-- Name: user_achievements user_achievements_achievement_id_achievements_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_achievements_id_fk FOREIGN KEY (achievement_id) REFERENCES public.achievements(id);


--
-- TOC entry 3674 (class 2606 OID 131138)
-- Name: user_achievements user_achievements_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3697 (class 2606 OID 1073211)
-- Name: user_activity_log user_activity_log_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id);


--
-- TOC entry 3698 (class 2606 OID 1073206)
-- Name: user_activity_log user_activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3711 (class 2606 OID 1425664)
-- Name: user_onboarding_progress user_onboarding_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_onboarding_progress
    ADD CONSTRAINT user_onboarding_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3693 (class 2606 OID 1073171)
-- Name: user_permissions user_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- TOC entry 3694 (class 2606 OID 1073166)
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3675 (class 2606 OID 131148)
-- Name: user_stats user_stats_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3712 (class 2606 OID 1499186)
-- Name: user_trial_achievements user_trial_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trial_achievements
    ADD CONSTRAINT user_trial_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.trial_achievements(id) ON DELETE CASCADE;


--
-- TOC entry 3713 (class 2606 OID 1499181)
-- Name: user_trial_achievements user_trial_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_trial_achievements
    ADD CONSTRAINT user_trial_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3666 (class 2606 OID 1073152)
-- Name: users users_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id);


--
-- TOC entry 3667 (class 2606 OID 204846)
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- TOC entry 3861 (class 0 OID 81920)
-- Dependencies: 216
-- Name: check_ins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3874 (class 3256 OID 1745236)
-- Name: check_ins check_ins_organization_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY check_ins_organization_policy ON public.check_ins USING ((public.is_system_owner() OR (EXISTS ( SELECT 1
   FROM ((public.key_results
     JOIN public.objectives ON ((objectives.id = key_results.objective_id)))
     JOIN public.users ON ((users.id = objectives.owner_id)))
  WHERE ((key_results.id = check_ins.key_result_id) AND (users.organization_id = public.get_current_organization_id()))))));


--
-- TOC entry 3868 (class 0 OID 114698)
-- Dependencies: 227
-- Name: initiative_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.initiative_members ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3881 (class 3256 OID 1745238)
-- Name: initiative_members initiative_members_organization_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY initiative_members_organization_policy ON public.initiative_members USING ((public.is_system_owner() OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = initiative_members.user_id) AND (users.organization_id = public.get_current_organization_id()))))));


--
-- TOC entry 3869 (class 0 OID 188416)
-- Dependencies: 235
-- Name: initiative_success_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.initiative_success_metrics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3882 (class 3256 OID 1745239)
-- Name: initiative_success_metrics initiative_success_metrics_organization_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY initiative_success_metrics_organization_policy ON public.initiative_success_metrics USING ((public.is_system_owner() OR (EXISTS ( SELECT 1
   FROM (public.initiatives
     JOIN public.users ON ((users.id = initiatives.created_by)))
  WHERE ((initiatives.id = initiative_success_metrics.initiative_id) AND (users.organization_id = public.get_current_organization_id()))))));


--
-- TOC entry 3862 (class 0 OID 81939)
-- Dependencies: 218
-- Name: initiatives; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3875 (class 3256 OID 1745234)
-- Name: initiatives initiatives_organization_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY initiatives_organization_policy ON public.initiatives USING ((public.is_system_owner() OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = initiatives.created_by) AND (users.organization_id = public.get_current_organization_id()))))));


--
-- TOC entry 3863 (class 0 OID 81950)
-- Dependencies: 219
-- Name: key_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3876 (class 3256 OID 1745232)
-- Name: key_results key_results_organization_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY key_results_organization_policy ON public.key_results USING ((public.is_system_owner() OR (EXISTS ( SELECT 1
   FROM (public.objectives
     JOIN public.users ON ((users.id = objectives.owner_id)))
  WHERE ((objectives.id = key_results.objective_id) AND (users.organization_id = public.get_current_organization_id()))))));


--
-- TOC entry 3864 (class 0 OID 81964)
-- Dependencies: 220
-- Name: objectives; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3877 (class 3256 OID 1745231)
-- Name: objectives objectives_organization_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY objectives_organization_policy ON public.objectives USING ((public.is_system_owner() OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = objectives.owner_id) AND (users.organization_id = public.get_current_organization_id()))))));


--
-- TOC entry 3873 (class 0 OID 204825)
-- Dependencies: 239
-- Name: organization_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3889 (class 3256 OID 1745243)
-- Name: organization_subscriptions organization_subscriptions_access_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY organization_subscriptions_access_policy ON public.organization_subscriptions USING ((public.is_system_owner() OR (organization_id = public.get_current_organization_id())));


--
-- TOC entry 3872 (class 0 OID 204813)
-- Dependencies: 238
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3888 (class 3256 OID 1745242)
-- Name: organizations organizations_access_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY organizations_access_policy ON public.organizations USING ((public.is_system_owner() OR (id = public.get_current_organization_id()) OR (owner_id = public.get_current_user_id())));


--
-- TOC entry 3871 (class 0 OID 204800)
-- Dependencies: 237
-- Name: subscription_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3886 (class 3256 OID 1745247)
-- Name: subscription_plans subscription_plans_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY subscription_plans_delete_policy ON public.subscription_plans FOR DELETE USING (public.is_system_owner());


--
-- TOC entry 3884 (class 3256 OID 1745245)
-- Name: subscription_plans subscription_plans_modify_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY subscription_plans_modify_policy ON public.subscription_plans FOR INSERT WITH CHECK (public.is_system_owner());


--
-- TOC entry 3885 (class 3256 OID 1745244)
-- Name: subscription_plans subscription_plans_read_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY subscription_plans_read_policy ON public.subscription_plans FOR SELECT USING (true);


--
-- TOC entry 3887 (class 3256 OID 1745246)
-- Name: subscription_plans subscription_plans_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY subscription_plans_update_policy ON public.subscription_plans FOR UPDATE USING (public.is_system_owner());


--
-- TOC entry 3870 (class 0 OID 188433)
-- Dependencies: 236
-- Name: success_metric_updates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.success_metric_updates ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3883 (class 3256 OID 1745241)
-- Name: success_metric_updates success_metric_updates_organization_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY success_metric_updates_organization_policy ON public.success_metric_updates USING ((public.is_system_owner() OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = success_metric_updates.created_by) AND (users.organization_id = public.get_current_organization_id()))))));


--
-- TOC entry 3865 (class 0 OID 81974)
-- Dependencies: 221
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3878 (class 3256 OID 1745235)
-- Name: tasks tasks_organization_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tasks_organization_policy ON public.tasks USING ((public.is_system_owner() OR (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = tasks.created_by) AND (users.organization_id = public.get_current_organization_id()))))));


--
-- TOC entry 3866 (class 0 OID 81995)
-- Dependencies: 223
-- Name: teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3879 (class 3256 OID 1745230)
-- Name: teams teams_organization_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY teams_organization_policy ON public.teams USING ((public.is_system_owner() OR (organization_id = public.get_current_organization_id())));


--
-- TOC entry 3867 (class 0 OID 82014)
-- Dependencies: 225
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 3880 (class 3256 OID 1745229)
-- Name: users users_organization_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_organization_policy ON public.users USING ((public.is_system_owner() OR (organization_id = public.get_current_organization_id())));


-- Completed on 2025-07-10 08:23:25 UTC

--
-- PostgreSQL database dump complete
--

