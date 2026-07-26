-- ============================================================
-- FIX: Replace all helper-function-based RLS policies with
-- direct subqueries to eliminate RLS recursion for members.
-- Affects: community_members, community_messages,
--          community_resources, community_custom_resources
-- ============================================================

-- ── 1. community_members SELECT ──────────────────────────────
-- Drop every existing select policy on this table
DROP POLICY IF EXISTS community_members_select_self        ON public.community_members;
DROP POLICY IF EXISTS community_members_select_admin       ON public.community_members;
DROP POLICY IF EXISTS community_members_select_all_members ON public.community_members;
DROP POLICY IF EXISTS community_members_select_member      ON public.community_members;

-- Single policy: own row OR creator of the community OR any member of the community
CREATE POLICY community_members_select_all
  ON public.community_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_members.community_id
        AND cm.user_id = auth.uid()
    )
  );

-- ── 2. community_messages SELECT ─────────────────────────────
DROP POLICY IF EXISTS community_messages_select_member ON public.community_messages;

CREATE POLICY community_messages_select_member
  ON public.community_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_messages.community_id
        AND cm.user_id = auth.uid()
    )
  );

-- ── 3. community_messages INSERT ─────────────────────────────
DROP POLICY IF EXISTS community_messages_insert_member ON public.community_messages;

CREATE POLICY community_messages_insert_member
  ON public.community_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_messages.community_id
        AND cm.user_id = auth.uid()
    )
  );

-- ── 4. community_messages DELETE ─────────────────────────────
DROP POLICY IF EXISTS community_messages_delete_admin              ON public.community_messages;
DROP POLICY IF EXISTS community_messages_delete_author_or_admin    ON public.community_messages;
DROP POLICY IF EXISTS community_messages_delete_own_or_admin       ON public.community_messages;

CREATE POLICY community_messages_delete_own_or_admin
  ON public.community_messages FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_messages.community_id
        AND c.created_by = auth.uid()
    )
  );

-- ── 5. community_resources SELECT ────────────────────────────
DROP POLICY IF EXISTS community_resources_select_member ON public.community_resources;

CREATE POLICY community_resources_select_member
  ON public.community_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_resources.community_id
        AND cm.user_id = auth.uid()
    )
  );

-- ── 6. community_resources INSERT ────────────────────────────
DROP POLICY IF EXISTS community_resources_insert_member ON public.community_resources;

CREATE POLICY community_resources_insert_member
  ON public.community_resources FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_resources.community_id
        AND cm.user_id = auth.uid()
    )
  );

-- ── 7. community_resources DELETE ────────────────────────────
DROP POLICY IF EXISTS community_resources_delete_admin ON public.community_resources;

CREATE POLICY community_resources_delete_admin
  ON public.community_resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_resources.community_id
        AND c.created_by = auth.uid()
    )
  );

-- ── 8. community_custom_resources SELECT ─────────────────────
DROP POLICY IF EXISTS ccr_select_member ON public.community_custom_resources;

CREATE POLICY ccr_select_member
  ON public.community_custom_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_custom_resources.community_id
        AND cm.user_id = auth.uid()
    )
  );

-- ── 9. community_custom_resources INSERT ─────────────────────
DROP POLICY IF EXISTS ccr_insert_member ON public.community_custom_resources;

CREATE POLICY ccr_insert_member
  ON public.community_custom_resources FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_custom_resources.community_id
        AND cm.user_id = auth.uid()
    )
  );

-- ── 10. community_custom_resources DELETE ────────────────────
DROP POLICY IF EXISTS ccr_delete_owner_or_admin ON public.community_custom_resources;

CREATE POLICY ccr_delete_owner_or_admin
  ON public.community_custom_resources FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_custom_resources.community_id
        AND c.created_by = auth.uid()
    )
  );

-- ── 11. community_members INSERT (fix recursion here too) ────
DROP POLICY IF EXISTS community_members_insert_admin ON public.community_members;

CREATE POLICY community_members_insert_admin
  ON public.community_members FOR INSERT
  WITH CHECK (
    role = 'member'
    AND EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
  );

-- ── 12. community_members DELETE ─────────────────────────────
DROP POLICY IF EXISTS community_members_delete_admin ON public.community_members;

CREATE POLICY community_members_delete_admin
  ON public.community_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
  );
