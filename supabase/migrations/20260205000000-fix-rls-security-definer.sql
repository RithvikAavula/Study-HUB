-- ============================================================
-- FINAL FIX: Use a SECURITY DEFINER function to check membership
-- without triggering RLS recursion on community_members.
-- All policies now call this function instead of querying the table directly.
-- ============================================================

-- Step 1: Drop the recursive self-referencing policy we added before
DROP POLICY IF EXISTS community_members_select_all        ON public.community_members;
DROP POLICY IF EXISTS community_members_select_all_members ON public.community_members;
DROP POLICY IF EXISTS community_members_select_self       ON public.community_members;
DROP POLICY IF EXISTS community_members_select_admin      ON public.community_members;
DROP POLICY IF EXISTS community_members_select_member     ON public.community_members;

-- Step 2: Create a SECURITY DEFINER function — runs as the function owner (postgres),
-- bypasses RLS entirely, so no recursion possible.
CREATE OR REPLACE FUNCTION public.get_my_community_ids()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ARRAY(
    SELECT community_id FROM public.community_members WHERE user_id = auth.uid()
  );
$$;

-- Step 3: community_members SELECT — use the security definer function
CREATE POLICY community_members_select_all
  ON public.community_members FOR SELECT
  USING (
    community_id = ANY(public.get_my_community_ids())
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
  );

-- Step 4: Fix community_messages policies
DROP POLICY IF EXISTS community_messages_select_member     ON public.community_messages;
DROP POLICY IF EXISTS community_messages_insert_member     ON public.community_messages;
DROP POLICY IF EXISTS community_messages_delete_admin      ON public.community_messages;
DROP POLICY IF EXISTS community_messages_delete_author_or_admin ON public.community_messages;
DROP POLICY IF EXISTS community_messages_delete_own_or_admin    ON public.community_messages;

CREATE POLICY community_messages_select_member
  ON public.community_messages FOR SELECT
  USING (community_id = ANY(public.get_my_community_ids()));

CREATE POLICY community_messages_insert_member
  ON public.community_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND community_id = ANY(public.get_my_community_ids())
  );

CREATE POLICY community_messages_delete_own_or_admin
  ON public.community_messages FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
  );

-- Step 5: Fix community_resources policies
DROP POLICY IF EXISTS community_resources_select_member ON public.community_resources;
DROP POLICY IF EXISTS community_resources_insert_member ON public.community_resources;
DROP POLICY IF EXISTS community_resources_delete_admin  ON public.community_resources;

CREATE POLICY community_resources_select_member
  ON public.community_resources FOR SELECT
  USING (community_id = ANY(public.get_my_community_ids()));

CREATE POLICY community_resources_insert_member
  ON public.community_resources FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND community_id = ANY(public.get_my_community_ids())
  );

CREATE POLICY community_resources_delete_admin
  ON public.community_resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
  );

-- Step 6: Fix community_custom_resources policies
DROP POLICY IF EXISTS ccr_select_member         ON public.community_custom_resources;
DROP POLICY IF EXISTS ccr_insert_member         ON public.community_custom_resources;
DROP POLICY IF EXISTS ccr_delete_owner_or_admin ON public.community_custom_resources;

CREATE POLICY ccr_select_member
  ON public.community_custom_resources FOR SELECT
  USING (community_id = ANY(public.get_my_community_ids()));

CREATE POLICY ccr_insert_member
  ON public.community_custom_resources FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND community_id = ANY(public.get_my_community_ids())
  );

CREATE POLICY ccr_delete_owner_or_admin
  ON public.community_custom_resources FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
  );

-- Step 7: Fix community_members INSERT and DELETE (use communities table, no recursion)
DROP POLICY IF EXISTS community_members_insert_admin ON public.community_members;
DROP POLICY IF EXISTS community_members_delete_admin ON public.community_members;

CREATE POLICY community_members_insert_admin
  ON public.community_members FOR INSERT
  WITH CHECK (
    role = 'member'
    AND EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
  );

CREATE POLICY community_members_delete_admin
  ON public.community_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
  );

-- Step 8: Also fix membership_requests policies that use helper functions
DROP POLICY IF EXISTS membership_requests_select_self_or_admin ON public.membership_requests;
DROP POLICY IF EXISTS membership_requests_update_admin         ON public.membership_requests;
DROP POLICY IF EXISTS membership_requests_delete_admin         ON public.membership_requests;

CREATE POLICY membership_requests_select_self_or_admin
  ON public.membership_requests FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
  );

CREATE POLICY membership_requests_update_admin
  ON public.membership_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
  );

CREATE POLICY membership_requests_delete_admin
  ON public.membership_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_id AND c.created_by = auth.uid()
    )
  );
