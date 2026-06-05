import BoardManageView from "./BoardManageView";

export default async function BoardManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BoardManageView boardId={id} />;
}
