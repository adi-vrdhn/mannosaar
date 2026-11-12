import AdminBlogManager from '@/components/admin/AdminBlogManager';

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminBlogManager mode="editor" editId={id} />;
}
