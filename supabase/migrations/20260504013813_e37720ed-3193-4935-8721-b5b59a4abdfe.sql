update storage.buckets
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
where id = 'company-documents';

-- Tighten write access: remove broad authenticated policies if they exist.
drop policy if exists "Authenticated users can upload company documents" on storage.objects;
drop policy if exists "Authenticated users can update company documents" on storage.objects;
drop policy if exists "Authenticated users can delete company documents" on storage.objects;

-- Keep/ensure public read for the bucket used in footer links.
drop policy if exists "Public read access for company documents" on storage.objects;
create policy "Public read access for company documents"
on storage.objects
for select
to public
using (bucket_id = 'company-documents');

-- Keep/ensure admin-only file management.
drop policy if exists "Admins write company docs" on storage.objects;
create policy "Admins write company docs"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'company-documents' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins update company docs v2" on storage.objects;
create policy "Admins update company docs v2"
on storage.objects
for update
to authenticated
using (bucket_id = 'company-documents' and public.has_role(auth.uid(), 'admin'))
with check (bucket_id = 'company-documents' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins delete company docs v2" on storage.objects;
create policy "Admins delete company docs v2"
on storage.objects
for delete
to authenticated
using (bucket_id = 'company-documents' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins read company docs" on storage.objects;
create policy "Admins read company docs"
on storage.objects
for select
to authenticated
using (bucket_id = 'company-documents' and public.has_role(auth.uid(), 'admin'));
