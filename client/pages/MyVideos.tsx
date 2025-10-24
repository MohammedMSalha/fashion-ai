import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Video {
  id: string;
  duration: string;
  quality: string;
  createdAt: string;
  thumbnail: string;
  downloadUrl: string;
}

export default function MyVideos() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setSearched(true);

    // Simulate API call - replace with actual backend call
    setTimeout(() => {
      // Mock data - remove when connected to real backend
      setVideos([
        {
          id: "1",
          duration: "5s",
          quality: "1080p",
          createdAt: "2024-01-15",
          thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
          downloadUrl: "#",
        },
        {
          id: "2",
          duration: "10s",
          quality: "720p",
          createdAt: "2024-01-10",
          thumbnail: "https://images.unsplash.com/photo-1539571696357-5a69c006b15d?w=400&h=300&fit=crop",
          downloadUrl: "#",
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-slate-900">My Videos</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12">
        {!searched ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Find Your Videos
            </h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Enter the email address you used to generate your videos and we'll
              display all your creations
            </p>

            <form onSubmit={handleSearch} className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base max-w-xs mx-auto block"
              />
              <Button
                type="submit"
                disabled={!email || loading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search Videos"
                )}
              </Button>
            </form>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearched(false);
                    setEmail("");
                    setVideos([]);
                  }}
                  className="gap-2"
                >
                  Change Email
                </Button>
              </div>

              {videos.length > 0 ? (
                <>
                  <p className="text-sm text-slate-600 mb-6">
                    Found <strong>{videos.length}</strong> video
                    {videos.length !== 1 ? "s" : ""} for{" "}
                    <strong>{email}</strong>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-slate-100 overflow-hidden group">
                          <img
                            src={video.thumbnail}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <svg
                              className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>

                        {/* Video Info */}
                        <div className="p-4">
                          <div className="flex gap-2 mb-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {video.duration}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {video.quality}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-4">
                            Generated on{" "}
                            {new Date(video.createdAt).toLocaleDateString()}
                          </p>
                          <Button
                            className="w-full gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            onClick={() => {
                              // Handle download
                              window.open(video.downloadUrl);
                            }}
                          >
                            <Download className="w-4 h-4" />
                            Download Video
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-slate-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-slate-600 text-lg font-medium mb-2">
                    No videos found
                  </p>
                  <p className="text-slate-500 mb-6">
                    Start by creating your first AI fashion video
                  </p>
                  <Button
                    onClick={() => navigate("/")}
                    className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    Create Video
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
