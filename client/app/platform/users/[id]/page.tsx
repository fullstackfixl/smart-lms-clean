"use client"

import { useParams } from 'next/navigation'
import { UserProfileDetail } from '../../../../components/profile/UserProfileDetail'

export default function PlatformUserProfilePage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="p-4 sm:p-8">
      <UserProfileDetail userId={id} source="platform" />
    </div>
  )
}
