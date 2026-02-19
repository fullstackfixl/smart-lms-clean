'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, User } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface LiveClass {
  _id: string;
  title: string;
  description: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  meeting_url: string;
  status: string;
  course_id: {
    _id: string;
    title: string;
  };
  instructor_id: {
    _id: string;
    name: string;
  };
}

export default function StudentLiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const fetchLiveClasses = async () => {
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token');
      
      const response = await fetch(`${API_URL}/student/live-classes/upcoming`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data.data?.classes || []);
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const joinClass = (meetingUrl: string) => {
    window.open(meetingUrl, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      scheduled: 'bg-blue-500',
      live: 'bg-green-500',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-500'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading live classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Live Classes</h1>
        <p className="text-gray-600 mt-2">Join your upcoming live classes</p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Classes</h3>
            <p className="text-gray-600 text-center">
              You don't have any upcoming live classes scheduled.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((liveClass) => (
            <Card key={liveClass._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{liveClass.title}</CardTitle>
                  {getStatusBadge(liveClass.status)}
                </div>
                <CardDescription className="mt-2">
                  {liveClass.course_id?.title || 'Unknown Course'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveClass.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {liveClass.description}
                    </p>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(liveClass.scheduled_date)}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {liveClass.start_time} ({liveClass.duration_minutes} minutes)
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {liveClass.instructor_id?.name || 'Unknown Instructor'}
                  </div>

                  <Button
                    onClick={() => joinClass(liveClass.meeting_url)}
                    className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                    disabled={liveClass.status === 'cancelled' || liveClass.status === 'completed'}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Join Live Class
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
