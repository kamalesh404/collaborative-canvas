import { BoardCanvas } from "@/components/board/BoardCanvas";

interface BoardPageProps {
  params: Promise<{ room: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { room } = await params;

  return (
    <main className="board-shell">
      <BoardCanvas room={room} />
    </main>
  );
}
