


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."advisor_type_enum" AS ENUM (
    'TD',
    'TVCLabs',
    'Angel',
    'External'
);


ALTER TYPE "public"."advisor_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."campaign_email_type" AS ENUM (
    'portfolio_update',
    'founder_checkin',
    'event_invite',
    'funding_milestone',
    'general'
);


ALTER TYPE "public"."campaign_email_type" OWNER TO "postgres";


CREATE TYPE "public"."campaign_status" AS ENUM (
    'draft',
    'sent',
    'failed'
);


ALTER TYPE "public"."campaign_status" OWNER TO "postgres";


CREATE TYPE "public"."cap_table_currency_enum" AS ENUM (
    'USD',
    'GBP',
    'EUR',
    'NGN'
);


ALTER TYPE "public"."cap_table_currency_enum" OWNER TO "postgres";


CREATE TYPE "public"."doc_status_enum" AS ENUM (
    'Missing',
    'Submitted',
    'Reviewed',
    'Verified',
    'Outdated'
);


ALTER TYPE "public"."doc_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."exposure_status_enum" AS ENUM (
    'Active',
    'Converted',
    'Cancelled',
    'Exited'
);


ALTER TYPE "public"."exposure_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."exposure_type_enum" AS ENUM (
    'Equity',
    'SAFE',
    'Convertible Note',
    'Advisory Equity',
    'Option',
    'Warrant',
    'Revenue Share',
    'Carry Participation',
    'Board Seat',
    'Observer Rights',
    'Other'
);


ALTER TYPE "public"."exposure_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."holder_type_enum" AS ENUM (
    'Founder',
    'Angel',
    'Syndicate',
    'TVCLabs',
    'TD',
    'Corporate Investor',
    'VC Fund',
    'Employee',
    'Advisor',
    'Other'
);


ALTER TYPE "public"."holder_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."investment_round_enum" AS ENUM (
    'Pre-Seed',
    'Seed',
    'Series A',
    'Series B',
    'Series C',
    'Series D+',
    'Bridge',
    'Convertible Note',
    'SAFE',
    'Grant',
    'Other'
);


ALTER TYPE "public"."investment_round_enum" OWNER TO "postgres";


CREATE TYPE "public"."poem_section_enum" AS ENUM (
    'Vision',
    'Proposition',
    'Organisation',
    'Economics',
    'Milestones',
    'Administration'
);


ALTER TYPE "public"."poem_section_enum" OWNER TO "postgres";


CREATE TYPE "public"."portfolio_health_enum" AS ENUM (
    'Green',
    'Amber',
    'Red'
);


ALTER TYPE "public"."portfolio_health_enum" OWNER TO "postgres";


CREATE TYPE "public"."recipient_status" AS ENUM (
    'sent',
    'failed'
);


ALTER TYPE "public"."recipient_status" OWNER TO "postgres";


CREATE TYPE "public"."recipient_type" AS ENUM (
    'angel',
    'founder_portfolio',
    'founder_crm',
    'individual'
);


ALTER TYPE "public"."recipient_type" OWNER TO "postgres";


CREATE TYPE "public"."update_status_enum" AS ENUM (
    'Draft',
    'Submitted',
    'Reviewed'
);


ALTER TYPE "public"."update_status_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."exposure_as_of"("as_of" "date") RETURNS TABLE("position_id" "uuid", "company_id" "uuid", "holder_id" "uuid", "amount_invested" numeric)
    LANGUAGE "sql" STABLE
    AS $$
  select
    e.position_id,
    p.company_id,
    p.holder_id,
    sum(e.amount) as amount_invested
  from public.exposure_events e
  join public.exposure_positions p on p.id = e.position_id
  where e.effective_date <= as_of
  group by e.position_id, p.company_id, p.holder_id
$$;


ALTER FUNCTION "public"."exposure_as_of"("as_of" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT CASE 
    WHEN (auth.jwt() -> 'app_metadata' ->> 'role') IN ('internal', 'admin') THEN 'internal'
    ELSE COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), 'anon')
  END;
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."advisory_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "advisor_name" "text",
    "advisor_type" "public"."advisor_type_enum",
    "topic" "text",
    "session_date" "date",
    "next_action_date" "date",
    "next_action" "text",
    "owner" "text",
    "equity_or_fee" "text",
    "last_verified_date" "date",
    "verified_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."advisory_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."angel_exposures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "exposure_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."angel_exposures" OWNER TO "postgres";


COMMENT ON TABLE "public"."angel_exposures" IS 'Scopes angel portal access. Angels see only companies linked here.';



CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."app_settings" IS 'Global platform configuration. One row per setting key. Internal users can update values via the Settings page. Per-company overrides on cap_table_ownership take precedence over the threshold defaults stored here.';



CREATE TABLE IF NOT EXISTS "public"."campaign_recipients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "recipient_type" "public"."recipient_type" NOT NULL,
    "status" "public"."recipient_status" NOT NULL,
    "error_message" "text",
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."campaign_recipients" OWNER TO "postgres";


COMMENT ON TABLE "public"."campaign_recipients" IS 'One row per recipient per campaign send. Provides per-address delivery status for audit purposes.';



CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "email_type" "public"."campaign_email_type" NOT NULL,
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "recipient_pools" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "individual_emails" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "status" "public"."campaign_status" DEFAULT 'draft'::"public"."campaign_status" NOT NULL,
    "sent_by" "uuid",
    "sent_at" timestamp with time zone,
    "recipient_count" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "campaigns_body_not_empty" CHECK ((TRIM(BOTH FROM "body") <> ''::"text")),
    CONSTRAINT "campaigns_subject_not_empty" CHECK ((TRIM(BOTH FROM "subject") <> ''::"text")),
    CONSTRAINT "campaigns_title_not_empty" CHECK ((TRIM(BOTH FROM "title") <> ''::"text"))
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


COMMENT ON TABLE "public"."campaigns" IS 'One row per campaign compose + send. recipient_pools is a jsonb array of pool keys: [''angels'', ''founders_with_companies'', ''founders_crm_only'', ''all_founders''].';



CREATE TABLE IF NOT EXISTS "public"."cap_table_ownership" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "investment_date" "date",
    "investment_round" "public"."investment_round_enum",
    "amount_invested" numeric(18,2),
    "currency" "public"."cap_table_currency_enum" DEFAULT 'USD'::"public"."cap_table_currency_enum",
    "cap_table_at_investment_url" "text",
    "cap_table_at_investment_note" "text",
    "current_cap_table_url" "text",
    "current_cap_table_note" "text",
    "cap_table_last_updated" "date",
    "founder_ownership_at_investment" numeric(6,3),
    "current_founder_ownership" numeric(6,3),
    "tvc_ownership_at_investment" numeric(6,3),
    "current_tvc_ownership" numeric(6,3),
    "founder_dilution_alert_threshold" numeric(5,2) DEFAULT 25.00,
    "tvc_dilution_alert_threshold" numeric(5,2) DEFAULT 20.00,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "current_founder_ownership_range" CHECK ((("current_founder_ownership" >= (0)::numeric) AND ("current_founder_ownership" <= (100)::numeric))),
    CONSTRAINT "current_tvc_ownership_range" CHECK ((("current_tvc_ownership" >= (0)::numeric) AND ("current_tvc_ownership" <= (100)::numeric))),
    CONSTRAINT "founder_ownership_at_investment_range" CHECK ((("founder_ownership_at_investment" >= (0)::numeric) AND ("founder_ownership_at_investment" <= (100)::numeric))),
    CONSTRAINT "tvc_ownership_at_investment_range" CHECK ((("tvc_ownership_at_investment" >= (0)::numeric) AND ("tvc_ownership_at_investment" <= (100)::numeric)))
);


ALTER TABLE "public"."cap_table_ownership" OWNER TO "postgres";


COMMENT ON TABLE "public"."cap_table_ownership" IS 'One row per portfolio company. Tracks ownership positions at investment vs. today. All calculated fields (dilution, status) are derived in application code — not stored here.';



COMMENT ON COLUMN "public"."cap_table_ownership"."cap_table_last_updated" IS 'Date the *current* cap table document was last updated. Drives the Green/Amber/Red cap table status indicator.';



COMMENT ON COLUMN "public"."cap_table_ownership"."tvc_ownership_at_investment" IS 'Combined TVC Labs / TD / ARM ownership % at time of investment.';



COMMENT ON COLUMN "public"."cap_table_ownership"."founder_dilution_alert_threshold" IS 'Alert fires when founder_dilution exceeds this %. NULL = use system default (25%).';



COMMENT ON COLUMN "public"."cap_table_ownership"."tvc_dilution_alert_threshold" IS 'Alert fires when tvc ownership dilution exceeds this %. NULL = use system default (20%).';



CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "country" "text",
    "sector" "text",
    "stage" "text",
    "legal_entity" "text",
    "website" "text",
    "portfolio_health" "public"."portfolio_health_enum",
    "health_reviewed_at" "date",
    "health_reviewed_by" "text",
    "crm_founder_id" "uuid",
    "last_verified_date" "date",
    "verified_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "health_notes" "text",
    "founded_year" "text",
    "logo_url" "text",
    "bio" "text",
    "investment_date" "date",
    "instrument_type" "text",
    "amount_invested" numeric,
    "currency" "text" DEFAULT 'USD'::"text",
    "syndicate_holdings" "text",
    "logo_path" "text"
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


COMMENT ON COLUMN "public"."companies"."crm_founder_id" IS 'Optional link to CRM founders table. Internal team only. Never exposed to angels.';



COMMENT ON COLUMN "public"."companies"."logo_url" IS 'DEPRECATED — superseded by logo_path + Storage. Retained for staged migration review, not for new writes.';



COMMENT ON COLUMN "public"."companies"."logo_path" IS 'Supabase Storage object path in the company-logos bucket, e.g. {company_id}/logo.png. Public URL is derived at read time via getPublicUrl(), never stored.';



CREATE TABLE IF NOT EXISTS "public"."company_figure_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "figure_key" "text" NOT NULL,
    "document_name" "text" NOT NULL,
    "file_path" "text",
    "file_url" "text" NOT NULL,
    "file_size" numeric,
    "mime_type" "text",
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "uploaded_by" "uuid",
    "reconciliation_status" "text" DEFAULT 'Unverified'::"text" NOT NULL,
    "reconciliation_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "company_figure_documents_reconciliation_status_check" CHECK (("reconciliation_status" = ANY (ARRAY['Unverified'::"text", 'Pending'::"text", 'Reconciled'::"text", 'Discrepancy'::"text"])))
);


ALTER TABLE "public"."company_figure_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_health_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "health_status" "text" NOT NULL,
    "previous_status" "text",
    "notes" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "company_health_history_health_status_check" CHECK (("health_status" = ANY (ARRAY['Green'::"text", 'Amber'::"text", 'Red'::"text"]))),
    CONSTRAINT "company_health_history_previous_status_check" CHECK (("previous_status" = ANY (ARRAY['Green'::"text", 'Amber'::"text", 'Red'::"text"])))
);


ALTER TABLE "public"."company_health_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ddr_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "current_status" "text" DEFAULT 'Awaiting Documents'::"text" NOT NULL,
    "dgc_contact_name" "text",
    "notes" "text",
    "last_updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ddr_status" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."economic_exposure" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"uuid" AS "company_id",
    NULL::"uuid" AS "holder_id",
    NULL::"public"."holder_type_enum" AS "holder_type",
    NULL::"public"."exposure_type_enum" AS "exposure_type",
    NULL::"text" AS "instrument_name",
    NULL::"date" AS "issue_date",
    NULL::numeric AS "amount_invested",
    NULL::numeric AS "ownership_pct",
    NULL::"text" AS "share_class",
    NULL::"public"."exposure_status_enum" AS "status",
    NULL::"date" AS "last_verified_date",
    NULL::"text" AS "verified_by",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "updated_at";


ALTER VIEW "public"."economic_exposure" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exit_readiness" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "revenue_growth" integer,
    "governance" integer,
    "cap_table_quality" integer,
    "financial_reporting" integer,
    "product_maturity" integer,
    "team_depth" integer,
    "customer_concentration" integer,
    "fundraising_history" integer,
    "poemddr_completeness" integer,
    "acquirer_attractiveness" integer,
    "scored_at" "date",
    "scored_by" "text",
    "last_verified_date" "date",
    "verified_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "overall_readiness" "text",
    CONSTRAINT "exit_readiness_acquirer_attractiveness_check" CHECK ((("acquirer_attractiveness" >= 0) AND ("acquirer_attractiveness" <= 5))),
    CONSTRAINT "exit_readiness_cap_table_quality_check" CHECK ((("cap_table_quality" >= 0) AND ("cap_table_quality" <= 5))),
    CONSTRAINT "exit_readiness_customer_concentration_check" CHECK ((("customer_concentration" >= 0) AND ("customer_concentration" <= 5))),
    CONSTRAINT "exit_readiness_financial_reporting_check" CHECK ((("financial_reporting" >= 0) AND ("financial_reporting" <= 5))),
    CONSTRAINT "exit_readiness_fundraising_history_check" CHECK ((("fundraising_history" >= 0) AND ("fundraising_history" <= 5))),
    CONSTRAINT "exit_readiness_governance_check" CHECK ((("governance" >= 0) AND ("governance" <= 5))),
    CONSTRAINT "exit_readiness_poemddr_completeness_check" CHECK ((("poemddr_completeness" >= 0) AND ("poemddr_completeness" <= 5))),
    CONSTRAINT "exit_readiness_product_maturity_check" CHECK ((("product_maturity" >= 0) AND ("product_maturity" <= 5))),
    CONSTRAINT "exit_readiness_revenue_growth_check" CHECK ((("revenue_growth" >= 0) AND ("revenue_growth" <= 5))),
    CONSTRAINT "exit_readiness_team_depth_check" CHECK ((("team_depth" >= 0) AND ("team_depth" <= 5)))
);


ALTER TABLE "public"."exit_readiness" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exposure_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "position_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "effective_date" "date" NOT NULL,
    "amount" numeric NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "source_document_url" "text",
    "reverses_event_id" "uuid",
    "notes" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."exposure_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."exposure_events" IS 'Append-only ledger of position value changes. Never update or delete rows — corrections are new rows with reverses_event_id set and amount negated.';



CREATE TABLE IF NOT EXISTS "public"."exposure_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "holder_id" "uuid" NOT NULL,
    "holder_type" "public"."holder_type_enum" NOT NULL,
    "exposure_type" "public"."exposure_type_enum" NOT NULL,
    "instrument_name" "text",
    "issue_date" "date",
    "ownership_pct" numeric,
    "share_class" "text",
    "status" "public"."exposure_status_enum" DEFAULT 'Active'::"public"."exposure_status_enum" NOT NULL,
    "last_verified_date" "date",
    "verified_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exposure_positions" OWNER TO "postgres";


COMMENT ON TABLE "public"."exposure_positions" IS 'Master object. Every company relationship flows from here.';



CREATE TABLE IF NOT EXISTS "public"."founders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "startup_name" "text",
    "phone" "text",
    "industry" "text",
    "stage" "text",
    "city" "text",
    "country" "text" DEFAULT 'Nigeria'::"text",
    "ddr_status" "text" DEFAULT 'not_started'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "linkedin_url" "text",
    "user_id" "uuid"
);


ALTER TABLE "public"."founders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."founders"."linkedin_url" IS 'Linked url Linked to each member';



CREATE TABLE IF NOT EXISTS "public"."funding_rounds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "round_name" "text" NOT NULL,
    "amount_raised" numeric,
    "pre_money_valuation" numeric,
    "post_money_valuation" numeric,
    "date_closed" timestamp with time zone,
    "lead_investor" "text",
    "investors" "text"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."funding_rounds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funding_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "runway_months" integer,
    "current_raise_target" numeric,
    "instrument" "text",
    "lead_investor_status" "text",
    "existing_commitments" numeric,
    "followon_opportunity" boolean DEFAULT false,
    "last_verified_date" "date",
    "verified_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_actively_raising" boolean,
    "valuation_cap" numeric,
    "investor_materials_status" "text"
);


ALTER TABLE "public"."funding_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."holders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "holder_type" "public"."holder_type_enum" NOT NULL,
    "email" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_tvclabs_entity" boolean DEFAULT false
);


ALTER TABLE "public"."holders" OWNER TO "postgres";


COMMENT ON TABLE "public"."holders" IS 'All entities with economic exposure — angels, founders, TVCLabs, TD, etc.';



CREATE OR REPLACE VIEW "public"."master_ledger_status" WITH ("security_invoker"='on') AS
 SELECT "c"."id" AS "company_id",
    "c"."name" AS "company_name",
    "count"("p"."id") AS "total_positions",
    "count"("p"."id") FILTER (WHERE (("p"."last_verified_date" IS NOT NULL) AND ("p"."verified_by" IS NOT NULL))) AS "verified_positions",
    (("count"("p"."id") > 0) AND ("count"("p"."id") = "count"("p"."id") FILTER (WHERE (("p"."last_verified_date" IS NOT NULL) AND ("p"."verified_by" IS NOT NULL))))) AS "is_reconciled"
   FROM ("public"."companies" "c"
     LEFT JOIN "public"."exposure_positions" "p" ON (("p"."company_id" = "c"."id")))
  GROUP BY "c"."id", "c"."name";


ALTER VIEW "public"."master_ledger_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monthly_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "month" integer,
    "year" integer,
    "achievements" "text",
    "challenges" "text",
    "targets" "text",
    "submitted_by" "text",
    "submitted_at" timestamp with time zone,
    "status" "public"."update_status_enum" DEFAULT 'Draft'::"public"."update_status_enum" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "monthly_updates_month_check" CHECK ((("month" >= 1) AND ("month" <= 12)))
);


ALTER TABLE "public"."monthly_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."outreach_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_name" "text" NOT NULL,
    "subject" "text",
    "sent_to_count" integer DEFAULT 0,
    "segment_filters" "jsonb",
    "sent_by" "uuid",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "opens" integer DEFAULT 0 NOT NULL,
    "clicks" integer DEFAULT 0 NOT NULL,
    "failed_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."outreach_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."poem_ddr" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "section" "public"."poem_section_enum" NOT NULL,
    "document_name" "text",
    "doc_status" "public"."doc_status_enum" DEFAULT 'Missing'::"public"."doc_status_enum" NOT NULL,
    "submitted_at" "date",
    "reviewed_at" "date",
    "reviewed_by" "text",
    "last_verified_date" "date",
    "verified_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."poem_ddr" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."program_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "founder_id" "uuid",
    "program" "text" NOT NULL,
    "cohort" "text",
    "status" "text",
    "applied_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."program_applications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_emails" AS
 SELECT "id",
    "email"
   FROM "auth"."users";


ALTER VIEW "public"."user_emails" OWNER TO "postgres";


ALTER TABLE ONLY "public"."advisory_activity"
    ADD CONSTRAINT "advisory_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."angel_exposures"
    ADD CONSTRAINT "angel_exposures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."angel_exposures"
    ADD CONSTRAINT "angel_exposures_user_exposure_unique" UNIQUE ("user_id", "exposure_id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."campaign_recipients"
    ADD CONSTRAINT "campaign_recipients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cap_table_ownership"
    ADD CONSTRAINT "cap_table_ownership_company_id_unique" UNIQUE ("company_id");



ALTER TABLE ONLY "public"."cap_table_ownership"
    ADD CONSTRAINT "cap_table_ownership_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_figure_documents"
    ADD CONSTRAINT "company_figure_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_health_history"
    ADD CONSTRAINT "company_health_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ddr_status"
    ADD CONSTRAINT "ddr_status_company_unique" UNIQUE ("company_id");



ALTER TABLE ONLY "public"."ddr_status"
    ADD CONSTRAINT "ddr_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exit_readiness"
    ADD CONSTRAINT "exit_readiness_company_unique" UNIQUE ("company_id");



ALTER TABLE ONLY "public"."exit_readiness"
    ADD CONSTRAINT "exit_readiness_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exposure_events"
    ADD CONSTRAINT "exposure_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exposure_positions"
    ADD CONSTRAINT "exposure_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."founders"
    ADD CONSTRAINT "founders_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."founders"
    ADD CONSTRAINT "founders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funding_rounds"
    ADD CONSTRAINT "funding_rounds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funding_status"
    ADD CONSTRAINT "funding_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."holders"
    ADD CONSTRAINT "holders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_updates"
    ADD CONSTRAINT "monthly_updates_company_month_year_unique" UNIQUE ("company_id", "month", "year");



ALTER TABLE ONLY "public"."monthly_updates"
    ADD CONSTRAINT "monthly_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outreach_log"
    ADD CONSTRAINT "outreach_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."poem_ddr"
    ADD CONSTRAINT "poem_ddr_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."program_applications"
    ADD CONSTRAINT "program_applications_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_angel_exposures_user_exposure" ON "public"."angel_exposures" USING "btree" ("user_id", "exposure_id");



CREATE INDEX "idx_campaign_recipients_campaign_id" ON "public"."campaign_recipients" USING "btree" ("campaign_id");



CREATE INDEX "idx_campaign_recipients_email" ON "public"."campaign_recipients" USING "btree" ("email");



CREATE INDEX "idx_campaigns_sent_at" ON "public"."campaigns" USING "btree" ("sent_at" DESC);



CREATE INDEX "idx_campaigns_status" ON "public"."campaigns" USING "btree" ("status");



CREATE INDEX "idx_companies_crm_founder" ON "public"."companies" USING "btree" ("crm_founder_id");



CREATE INDEX "idx_company_figure_docs_company" ON "public"."company_figure_documents" USING "btree" ("company_id");



CREATE INDEX "idx_company_figure_docs_key" ON "public"."company_figure_documents" USING "btree" ("company_id", "figure_key");



CREATE INDEX "idx_ddr_status_company_id" ON "public"."ddr_status" USING "btree" ("company_id");



CREATE INDEX "idx_exposure_events_effective_date" ON "public"."exposure_events" USING "btree" ("effective_date");



CREATE INDEX "idx_exposure_events_position" ON "public"."exposure_events" USING "btree" ("position_id");



CREATE INDEX "idx_exposure_positions_company" ON "public"."exposure_positions" USING "btree" ("company_id");



CREATE INDEX "idx_founders_email" ON "public"."founders" USING "btree" ("email");



CREATE INDEX "idx_funding_rounds_company_id" ON "public"."funding_rounds" USING "btree" ("company_id");



CREATE INDEX "idx_funding_rounds_date_closed" ON "public"."funding_rounds" USING "btree" ("date_closed" DESC);



CREATE INDEX "idx_health_history_company_id" ON "public"."company_health_history" USING "btree" ("company_id");



CREATE INDEX "idx_health_history_reviewed_at" ON "public"."company_health_history" USING "btree" ("reviewed_at" DESC);



CREATE UNIQUE INDEX "one_reversal_per_event" ON "public"."exposure_events" USING "btree" ("reverses_event_id") WHERE ("reverses_event_id" IS NOT NULL);



CREATE OR REPLACE VIEW "public"."economic_exposure" WITH ("security_invoker"='on') AS
 SELECT "p"."id",
    "p"."company_id",
    "p"."holder_id",
    "p"."holder_type",
    "p"."exposure_type",
    "p"."instrument_name",
    "p"."issue_date",
    COALESCE("sum"("e"."amount"), (0)::numeric) AS "amount_invested",
    "p"."ownership_pct",
    "p"."share_class",
    "p"."status",
    "p"."last_verified_date",
    "p"."verified_by",
    "p"."created_at",
    "p"."updated_at"
   FROM ("public"."exposure_positions" "p"
     LEFT JOIN "public"."exposure_events" "e" ON (("e"."position_id" = "p"."id")))
  GROUP BY "p"."id";



CREATE OR REPLACE TRIGGER "companies_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "exposure_positions_updated_at" BEFORE UPDATE ON "public"."exposure_positions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "funding_status_updated_at" BEFORE UPDATE ON "public"."funding_status" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_app_settings" BEFORE UPDATE ON "public"."app_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_cap_table_ownership" BEFORE UPDATE ON "public"."cap_table_ownership" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."advisory_activity"
    ADD CONSTRAINT "advisory_activity_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."angel_exposures"
    ADD CONSTRAINT "angel_exposures_exposure_id_fkey" FOREIGN KEY ("exposure_id") REFERENCES "public"."exposure_positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."angel_exposures"
    ADD CONSTRAINT "angel_exposures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."campaign_recipients"
    ADD CONSTRAINT "campaign_recipients_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cap_table_ownership"
    ADD CONSTRAINT "cap_table_ownership_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_crm_founder_id_fkey" FOREIGN KEY ("crm_founder_id") REFERENCES "public"."founders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."company_figure_documents"
    ADD CONSTRAINT "company_figure_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_health_history"
    ADD CONSTRAINT "company_health_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_health_history"
    ADD CONSTRAINT "company_health_history_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ddr_status"
    ADD CONSTRAINT "ddr_status_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exit_readiness"
    ADD CONSTRAINT "exit_readiness_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exposure_events"
    ADD CONSTRAINT "exposure_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."exposure_events"
    ADD CONSTRAINT "exposure_events_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."exposure_positions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."exposure_events"
    ADD CONSTRAINT "exposure_events_reverses_event_id_fkey" FOREIGN KEY ("reverses_event_id") REFERENCES "public"."exposure_events"("id");



ALTER TABLE ONLY "public"."exposure_positions"
    ADD CONSTRAINT "exposure_positions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."exposure_positions"
    ADD CONSTRAINT "exposure_positions_holder_id_fkey" FOREIGN KEY ("holder_id") REFERENCES "public"."holders"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."founders"
    ADD CONSTRAINT "founders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funding_rounds"
    ADD CONSTRAINT "funding_rounds_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funding_status"
    ADD CONSTRAINT "funding_status_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."holders"
    ADD CONSTRAINT "holders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."monthly_updates"
    ADD CONSTRAINT "monthly_updates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."poem_ddr"
    ADD CONSTRAINT "poem_ddr_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_applications"
    ADD CONSTRAINT "program_applications_founder_id_fkey" FOREIGN KEY ("founder_id") REFERENCES "public"."founders"("id") ON DELETE CASCADE;



CREATE POLICY "Internal access for company_figure_documents" ON "public"."company_figure_documents" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Internal employees can read exit_readiness" ON "public"."exit_readiness" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'internal'::"text"));



CREATE POLICY "Internal employees can read funding_status" ON "public"."funding_status" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'internal'::"text"));



CREATE POLICY "Internal employees can read monthly_updates" ON "public"."monthly_updates" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'internal'::"text"));



ALTER TABLE "public"."advisory_activity" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "advisory_activity_internal_all" ON "public"."advisory_activity" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "angel_advisory_read" ON "public"."advisory_activity" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'angel'::"text") AND ("company_id" IN ( SELECT "advisory_activity"."company_id"
   FROM "public"."angel_exposures"
  WHERE ("angel_exposures"."user_id" = "auth"."uid"())))));



CREATE POLICY "angel_exit_readiness_read" ON "public"."exit_readiness" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'angel'::"text") AND ("company_id" IN ( SELECT "exit_readiness"."company_id"
   FROM "public"."angel_exposures"
  WHERE ("angel_exposures"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."angel_exposures" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "angel_exposures_internal_all" ON "public"."angel_exposures" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "angel_exposures_self_read" ON "public"."angel_exposures" FOR SELECT TO "authenticated" USING ((("public"."get_user_role"() = 'angel'::"text") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "angel_funding_rounds_read" ON "public"."funding_rounds" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'angel'::"text") AND ("company_id" IN ( SELECT "funding_rounds"."company_id"
   FROM "public"."angel_exposures"
  WHERE ("angel_exposures"."user_id" = "auth"."uid"())))));



CREATE POLICY "angel_read_scoped_cap_table_ownership" ON "public"."cap_table_ownership" FOR SELECT TO "authenticated" USING ((("public"."get_user_role"() = 'angel'::"text") AND ("company_id" IN ( SELECT "ee"."company_id"
   FROM ("public"."exposure_positions" "ee"
     JOIN "public"."angel_exposures" "ae" ON (("ae"."exposure_id" = "ee"."id")))
  WHERE ("ae"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_recipients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cap_table_ownership" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_angel_read" ON "public"."companies" FOR SELECT TO "authenticated" USING ((("public"."get_user_role"() = 'angel'::"text") AND ("id" IN ( SELECT "ee"."company_id"
   FROM ("public"."exposure_positions" "ee"
     JOIN "public"."angel_exposures" "ae" ON (("ae"."exposure_id" = "ee"."id")))
  WHERE ("ae"."user_id" = "auth"."uid"())))));



CREATE POLICY "companies_founder_read" ON "public"."companies" FOR SELECT TO "authenticated" USING ((("public"."get_user_role"() = 'founder'::"text") AND ("crm_founder_id" IN ( SELECT "f"."id"
   FROM "public"."founders" "f"
  WHERE ("f"."email" = ("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "companies_internal_all" ON "public"."companies" TO "authenticated" USING ((((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['internal'::"text", 'admin'::"text"])) OR ("public"."get_user_role"() = 'internal'::"text"))) WITH CHECK ((((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = ANY (ARRAY['internal'::"text", 'admin'::"text"])) OR ("public"."get_user_role"() = 'internal'::"text")));



ALTER TABLE "public"."company_figure_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_health_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ddr_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exit_readiness" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exit_readiness_internal_all" ON "public"."exit_readiness" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "exposure_angel_read" ON "public"."exposure_positions" FOR SELECT TO "authenticated" USING ((("public"."get_user_role"() = 'angel'::"text") AND ("id" IN ( SELECT "angel_exposures"."exposure_id"
   FROM "public"."angel_exposures"
  WHERE ("angel_exposures"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."exposure_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exposure_events_angel_own" ON "public"."exposure_events" FOR SELECT USING (((("auth"."jwt"() ->> 'role'::"text") = 'angel'::"text") AND ("position_id" IN ( SELECT "exposure_positions"."id"
   FROM "public"."exposure_positions"
  WHERE ("exposure_positions"."holder_id" IN ( SELECT "holders"."id"
           FROM "public"."holders"
          WHERE ("holders"."user_id" = "auth"."uid"())))))));



CREATE POLICY "exposure_events_internal_all" ON "public"."exposure_events" USING ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['internal'::"text", 'admin'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['internal'::"text", 'admin'::"text"])));



CREATE POLICY "exposure_internal_all" ON "public"."exposure_positions" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



ALTER TABLE "public"."exposure_positions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exposure_positions_angel_own" ON "public"."exposure_positions" FOR SELECT USING (((("auth"."jwt"() ->> 'role'::"text") = 'angel'::"text") AND ("holder_id" IN ( SELECT "holders"."id"
   FROM "public"."holders"
  WHERE ("holders"."user_id" = "auth"."uid"())))));



CREATE POLICY "exposure_positions_internal_all" ON "public"."exposure_positions" USING ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['internal'::"text", 'admin'::"text"]))) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['internal'::"text", 'admin'::"text"])));



CREATE POLICY "founder_advisory_read" ON "public"."advisory_activity" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'founder'::"text") AND ("company_id" IN ( SELECT "c"."id"
   FROM "public"."companies" "c"
  WHERE ("c"."crm_founder_id" IN ( SELECT "f"."id"
           FROM "public"."founders" "f"
          WHERE ("f"."email" = ("auth"."jwt"() ->> 'email'::"text"))))))));



CREATE POLICY "founder_exit_readiness_read" ON "public"."exit_readiness" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'founder'::"text") AND ("company_id" IN ( SELECT "c"."id"
   FROM "public"."companies" "c"
  WHERE ("c"."crm_founder_id" IN ( SELECT "f"."id"
           FROM "public"."founders" "f"
          WHERE ("f"."email" = ("auth"."jwt"() ->> 'email'::"text"))))))));



CREATE POLICY "founder_funding_rounds_read" ON "public"."funding_rounds" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'founder'::"text") AND ("company_id" IN ( SELECT "c"."id"
   FROM "public"."companies" "c"
  WHERE ("c"."crm_founder_id" IN ( SELECT "f"."id"
           FROM "public"."founders" "f"
          WHERE ("f"."email" = ("auth"."jwt"() ->> 'email'::"text"))))))));



ALTER TABLE "public"."founders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "founders_internal_all" ON "public"."founders" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "founders_internal_only" ON "public"."founders" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



ALTER TABLE "public"."funding_rounds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funding_status" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "funding_status_angel_read" ON "public"."funding_status" FOR SELECT TO "authenticated" USING ((("public"."get_user_role"() = 'angel'::"text") AND ("company_id" IN ( SELECT "ee"."company_id"
   FROM ("public"."exposure_positions" "ee"
     JOIN "public"."angel_exposures" "ae" ON (("ae"."exposure_id" = "ee"."id")))
  WHERE ("ae"."user_id" = "auth"."uid"())))));



CREATE POLICY "funding_status_internal_all" ON "public"."funding_status" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "health_history_angel_read" ON "public"."company_health_history" FOR SELECT USING ((("public"."get_user_role"() = 'angel'::"text") AND (EXISTS ( SELECT 1
   FROM ("public"."angel_exposures" "ae"
     JOIN "public"."exposure_positions" "ee" ON (("ee"."id" = "ae"."exposure_id")))
  WHERE (("ae"."user_id" = "auth"."uid"()) AND ("ee"."company_id" = "company_health_history"."company_id"))))));



CREATE POLICY "health_history_founder_read" ON "public"."company_health_history" FOR SELECT USING ((("public"."get_user_role"() = 'founder'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."companies" "c"
  WHERE (("c"."id" = "company_health_history"."company_id") AND ("c"."crm_founder_id" = "auth"."uid"()))))));



CREATE POLICY "health_history_internal_all" ON "public"."company_health_history" USING (("public"."get_user_role"() = 'internal'::"text"));



ALTER TABLE "public"."holders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "holders_angel_self_read" ON "public"."holders" FOR SELECT TO "authenticated" USING ((("public"."get_user_role"() = 'angel'::"text") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "holders_internal_all" ON "public"."holders" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "internal_advisory_all" ON "public"."advisory_activity" TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'internal'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'internal'::"text"));



CREATE POLICY "internal_ddr_all" ON "public"."ddr_status" TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'internal'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'internal'::"text"));



CREATE POLICY "internal_exit_readiness_all" ON "public"."exit_readiness" TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'internal'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'internal'::"text"));



CREATE POLICY "internal_full_access_app_settings" ON "public"."app_settings" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "internal_full_access_campaign_recipients" ON "public"."campaign_recipients" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "internal_full_access_campaigns" ON "public"."campaigns" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "internal_full_access_cap_table_ownership" ON "public"."cap_table_ownership" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "internal_funding_rounds_all" ON "public"."funding_rounds" TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'internal'::"text")) WITH CHECK (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'internal'::"text"));



ALTER TABLE "public"."monthly_updates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "monthly_updates_angel_read" ON "public"."monthly_updates" FOR SELECT TO "authenticated" USING ((("public"."get_user_role"() = 'angel'::"text") AND ("company_id" IN ( SELECT "ee"."company_id"
   FROM ("public"."exposure_positions" "ee"
     JOIN "public"."angel_exposures" "ae" ON (("ae"."exposure_id" = "ee"."id")))
  WHERE ("ae"."user_id" = "auth"."uid"())))));



CREATE POLICY "monthly_updates_founder_all" ON "public"."monthly_updates" TO "authenticated" USING ((("public"."get_user_role"() = 'founder'::"text") AND ("company_id" IN ( SELECT "c"."id"
   FROM ("public"."companies" "c"
     JOIN "public"."founders" "f" ON (("f"."id" = "c"."crm_founder_id")))
  WHERE ("f"."email" = ("auth"."jwt"() ->> 'email'::"text")))))) WITH CHECK ((("public"."get_user_role"() = 'founder'::"text") AND ("company_id" IN ( SELECT "c"."id"
   FROM ("public"."companies" "c"
     JOIN "public"."founders" "f" ON (("f"."id" = "c"."crm_founder_id")))
  WHERE ("f"."email" = ("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "monthly_updates_internal_all" ON "public"."monthly_updates" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "monthly_updates_internal_read" ON "public"."monthly_updates" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'role'::"text") = 'internal'::"text"));



ALTER TABLE "public"."outreach_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "outreach_log_internal_all" ON "public"."outreach_log" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "outreach_log_internal_only" ON "public"."outreach_log" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



ALTER TABLE "public"."poem_ddr" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "poem_ddr_angel_read" ON "public"."poem_ddr" FOR SELECT TO "authenticated" USING ((("public"."get_user_role"() = 'angel'::"text") AND ("company_id" IN ( SELECT "ee"."company_id"
   FROM ("public"."exposure_positions" "ee"
     JOIN "public"."angel_exposures" "ae" ON (("ae"."exposure_id" = "ee"."id")))
  WHERE ("ae"."user_id" = "auth"."uid"())))));



CREATE POLICY "poem_ddr_founder_all" ON "public"."poem_ddr" TO "authenticated" USING ((("public"."get_user_role"() = 'founder'::"text") AND ("company_id" IN ( SELECT "c"."id"
   FROM ("public"."companies" "c"
     JOIN "public"."founders" "f" ON (("f"."id" = "c"."crm_founder_id")))
  WHERE ("f"."email" = ("auth"."jwt"() ->> 'email'::"text")))))) WITH CHECK ((("public"."get_user_role"() = 'founder'::"text") AND ("company_id" IN ( SELECT "c"."id"
   FROM ("public"."companies" "c"
     JOIN "public"."founders" "f" ON (("f"."id" = "c"."crm_founder_id")))
  WHERE ("f"."email" = ("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "poem_ddr_internal_all" ON "public"."poem_ddr" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



ALTER TABLE "public"."program_applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "program_applications_internal_all" ON "public"."program_applications" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



CREATE POLICY "program_applications_internal_only" ON "public"."program_applications" TO "authenticated" USING (("public"."get_user_role"() = 'internal'::"text")) WITH CHECK (("public"."get_user_role"() = 'internal'::"text"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."exposure_as_of"("as_of" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."exposure_as_of"("as_of" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."exposure_as_of"("as_of" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."advisory_activity" TO "anon";
GRANT ALL ON TABLE "public"."advisory_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."advisory_activity" TO "service_role";



GRANT ALL ON TABLE "public"."angel_exposures" TO "anon";
GRANT ALL ON TABLE "public"."angel_exposures" TO "authenticated";
GRANT ALL ON TABLE "public"."angel_exposures" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_recipients" TO "anon";
GRANT ALL ON TABLE "public"."campaign_recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_recipients" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."cap_table_ownership" TO "anon";
GRANT ALL ON TABLE "public"."cap_table_ownership" TO "authenticated";
GRANT ALL ON TABLE "public"."cap_table_ownership" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."company_figure_documents" TO "anon";
GRANT ALL ON TABLE "public"."company_figure_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."company_figure_documents" TO "service_role";



GRANT ALL ON TABLE "public"."company_health_history" TO "anon";
GRANT ALL ON TABLE "public"."company_health_history" TO "authenticated";
GRANT ALL ON TABLE "public"."company_health_history" TO "service_role";



GRANT ALL ON TABLE "public"."ddr_status" TO "anon";
GRANT ALL ON TABLE "public"."ddr_status" TO "authenticated";
GRANT ALL ON TABLE "public"."ddr_status" TO "service_role";



GRANT ALL ON TABLE "public"."economic_exposure" TO "anon";
GRANT ALL ON TABLE "public"."economic_exposure" TO "authenticated";
GRANT ALL ON TABLE "public"."economic_exposure" TO "service_role";



GRANT ALL ON TABLE "public"."exit_readiness" TO "anon";
GRANT ALL ON TABLE "public"."exit_readiness" TO "authenticated";
GRANT ALL ON TABLE "public"."exit_readiness" TO "service_role";



GRANT ALL ON TABLE "public"."exposure_events" TO "anon";
GRANT ALL ON TABLE "public"."exposure_events" TO "authenticated";
GRANT ALL ON TABLE "public"."exposure_events" TO "service_role";



GRANT ALL ON TABLE "public"."exposure_positions" TO "anon";
GRANT ALL ON TABLE "public"."exposure_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."exposure_positions" TO "service_role";



GRANT ALL ON TABLE "public"."founders" TO "anon";
GRANT ALL ON TABLE "public"."founders" TO "authenticated";
GRANT ALL ON TABLE "public"."founders" TO "service_role";



GRANT ALL ON TABLE "public"."funding_rounds" TO "anon";
GRANT ALL ON TABLE "public"."funding_rounds" TO "authenticated";
GRANT ALL ON TABLE "public"."funding_rounds" TO "service_role";



GRANT ALL ON TABLE "public"."funding_status" TO "anon";
GRANT ALL ON TABLE "public"."funding_status" TO "authenticated";
GRANT ALL ON TABLE "public"."funding_status" TO "service_role";



GRANT ALL ON TABLE "public"."holders" TO "anon";
GRANT ALL ON TABLE "public"."holders" TO "authenticated";
GRANT ALL ON TABLE "public"."holders" TO "service_role";



GRANT ALL ON TABLE "public"."master_ledger_status" TO "anon";
GRANT ALL ON TABLE "public"."master_ledger_status" TO "authenticated";
GRANT ALL ON TABLE "public"."master_ledger_status" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_updates" TO "anon";
GRANT ALL ON TABLE "public"."monthly_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_updates" TO "service_role";



GRANT ALL ON TABLE "public"."outreach_log" TO "anon";
GRANT ALL ON TABLE "public"."outreach_log" TO "authenticated";
GRANT ALL ON TABLE "public"."outreach_log" TO "service_role";



GRANT ALL ON TABLE "public"."poem_ddr" TO "anon";
GRANT ALL ON TABLE "public"."poem_ddr" TO "authenticated";
GRANT ALL ON TABLE "public"."poem_ddr" TO "service_role";



GRANT ALL ON TABLE "public"."program_applications" TO "anon";
GRANT ALL ON TABLE "public"."program_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."program_applications" TO "service_role";



GRANT ALL ON TABLE "public"."user_emails" TO "anon";
GRANT ALL ON TABLE "public"."user_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."user_emails" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







