import { CasoDetailClient } from '@/components/casos/CasoDetailClient'

export default function CasoDetailPage({ params }: { params: { id: string } }) {
  return <CasoDetailClient id={params.id} />
}
