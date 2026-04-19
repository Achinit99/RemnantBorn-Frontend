-- Community social feed image support setup
-- Run in Supabase SQL Editor.

-- 1) Add optional image URL column on posts.
alter table public.posts
add column if not exists image_url text;

-- 2) Create public storage bucket for post images.
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = excluded.public;

-- 3) Storage policies for authenticated users.
-- Adjust policy names if they already exist in your project.
drop policy if exists "post_images_public_read" on storage.objects;
create policy "post_images_public_read"
on storage.objects for select
using (bucket_id = 'post-images');

drop policy if exists "post_images_authenticated_upload" on storage.objects;
create policy "post_images_authenticated_upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'post-images');

drop policy if exists "post_images_authenticated_update" on storage.objects;
create policy "post_images_authenticated_update"
on storage.objects for update
to authenticated
using (bucket_id = 'post-images')
with check (bucket_id = 'post-images');

drop policy if exists "post_images_authenticated_delete" on storage.objects;
create policy "post_images_authenticated_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'post-images');
