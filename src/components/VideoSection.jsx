

import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../api/api';
import { UserPlus, CalendarCheck, CreditCard } from 'lucide-react';

const YOUTUBE_VIDEO_ID = 'e4iECtG9OfE';
const FALLBACK_VIDEO = {
  id: `youtube-${YOUTUBE_VIDEO_ID}`,
  youtubeId: YOUTUBE_VIDEO_ID,
  title: 'Michigan English Placement Test',
  description: '',
  tabLabel: 'Michigan English Placement Test',
};

let youtubeApiPromise = null;

const loadYouTubeIframeApi = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('YouTube Player API did not initialize.'));
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => reject(new Error('YouTube Player API could not be loaded.'));
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
};

const formatVideoTime = (seconds) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const YouTubeCustomPlayer = ({ videoId, title }) => {
  const hostRef = useRef(null);
  const wrapperRef = useRef(null);
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    let progressTimer = null;

    loadYouTubeIframeApi()
      .then((YT) => {
        if (disposed || !hostRef.current) return;
        const player = new YT.Player(hostRef.current, {
          host: 'https://www.youtube-nocookie.com',
          width: '100%',
          height: '100%',
          videoId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (disposed) return;
              playerRef.current = event.target;
              setReady(true);
              setDuration(event.target.getDuration?.() || 0);
              setVolume(event.target.getVolume?.() ?? 100);
              setMuted(Boolean(event.target.isMuted?.()));
              progressTimer = window.setInterval(() => {
                const activePlayer = playerRef.current;
                if (!activePlayer?.getCurrentTime) return;
                setCurrentTime(activePlayer.getCurrentTime() || 0);
                setDuration(activePlayer.getDuration() || 0);
              }, 500);
            },
            onStateChange: (event) => {
              if (disposed) return;
              setPlaying(event.data === YT.PlayerState.PLAYING);
              if (event.data === YT.PlayerState.ENDED) setCurrentTime(0);
            },
            onError: () => {
              if (!disposed) setError('The YouTube video could not be played.');
            },
          },
        });
        playerRef.current = player;
      })
      .catch((loadError) => {
        if (!disposed) setError(loadError.message || 'The YouTube player could not be loaded.');
      });

    return () => {
      disposed = true;
      if (progressTimer !== null) clearInterval(progressTimer);
      try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, [videoId]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!ready || !player) return;
    if (player.getPlayerState?.() === window.YT?.PlayerState?.PLAYING) player.pauseVideo?.();
    else player.playVideo?.();
  };

  const seek = (event) => {
    if (!ready || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    playerRef.current?.seekTo?.(ratio * duration, true);
    setCurrentTime(ratio * duration);
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!ready || !player) return;
    if (muted) {
      player.unMute?.();
      setMuted(false);
    } else {
      player.mute?.();
      setMuted(true);
    }
  };

  const changeVolume = (event) => {
    const nextVolume = Number(event.target.value);
    setVolume(nextVolume);
    playerRef.current?.setVolume?.(nextVolume);
    if (nextVolume === 0) {
      playerRef.current?.mute?.();
      setMuted(true);
    } else {
      playerRef.current?.unMute?.();
      setMuted(false);
    }
  };

  const enterFullscreen = () => {
    const wrapper = wrapperRef.current;
    const request = wrapper?.requestFullscreen || wrapper?.webkitRequestFullscreen;
    request?.call(wrapper);
  };

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div ref={wrapperRef} className="absolute inset-0 bg-black group/youtube" aria-label={title}>
      <div ref={hostRef} className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full" />

      {!playing && ready && !error && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#024890] shadow-xl transition hover:scale-110 sm:h-20 sm:w-20"
          aria-label="Play video"
        >
          <svg className="h-8 w-8 translate-x-0.5 sm:h-10 sm:w-10" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </button>
      )}

      {error ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center text-white">
          <p>{error}</p>
          <a
            href={`https://youtu.be/${videoId}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#024890] px-5 py-2 font-semibold hover:bg-blue-700"
          >
            Open on YouTube
          </a>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-3 pb-3 pt-10 opacity-100 transition sm:px-4 sm:pb-4 sm:opacity-0 sm:group-hover/youtube:opacity-100">
          <button
            type="button"
            onClick={seek}
            className="mb-3 block h-2 w-full cursor-pointer rounded-full bg-white/30 text-left"
            aria-label="Seek video"
          >
            <span className="block h-full rounded-full bg-[#1477d4]" style={{ width: `${progress}%` }} />
          </button>

          <div className="flex items-center justify-between gap-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={togglePlay} disabled={!ready} aria-label={playing ? 'Pause video' : 'Play video'}>
                {playing ? (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4.75A.75.75 0 015.75 4h2.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-2.5a.75.75 0 01-.75-.75V4.75zm6 0a.75.75 0 01.75-.75h2.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-2.5a.75.75 0 01-.75-.75V4.75z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                )}
              </button>

              <button type="button" onClick={toggleMute} disabled={!ready} aria-label={muted ? 'Unmute video' : 'Mute video'}>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" />
                  {muted && <path d="M12.3 7.3a1 1 0 011.4 0L15 8.6l1.3-1.3a1 1 0 111.4 1.4L16.4 10l1.3 1.3a1 1 0 01-1.4 1.4L15 11.4l-1.3 1.3a1 1 0 01-1.4-1.4l1.3-1.3-1.3-1.3a1 1 0 010-1.4z" />}
                </svg>
              </button>

              <input
                type="range"
                min="0"
                max="100"
                value={muted ? 0 : volume}
                onChange={changeVolume}
                className="hidden w-20 sm:block"
                style={{ accentColor: '#1477d4' }}
                aria-label="Video volume"
              />

              <span className="whitespace-nowrap text-xs font-medium sm:text-sm">
                {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
              </span>
            </div>

            <button type="button" onClick={enterFullscreen} aria-label="Enter fullscreen">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.4l2.3 2.3a1 1 0 11-1.4 1.4L5 6.4V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.4l-2.3 2.3a1 1 0 11-1.4-1.4L13.6 5H12zM3 12a1 1 0 012 0v1.6l2.3-2.3a1 1 0 111.4 1.4L6.4 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.6l-2.3-2.3a1 1 0 111.4-1.4l2.3 2.3V12a1 1 0 011-1z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const VideoSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await ApiService.getVideos();
        if (data && data.length > 0) {
          const formattedVideos = data.map((v, index) => ({
            id: v.id,
            url: v.video,
            youtubeId: index === 0 ? YOUTUBE_VIDEO_ID : null,
            title: v.title,
            description: v.description || "",
            tabLabel: v.title // Use title as tab label or could use a shortened version
          }));
          setVideos(formattedVideos);
        } else {
          setVideos([FALLBACK_VIDEO]);
        }
      } catch (error) {
        console.error("Failed to fetch videos", error);
        setVideos([FALLBACK_VIDEO]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const currentVideo = videos.length > 0 ? videos[activeTab] : null;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);


  // Reset video state when switching tabs
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [activeTab]);

  // Video controls handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    const container = containerRef.current;

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      // iOS Safari — only video element supports fullscreen
      if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
        setIsFullscreen(true);
        return;
      }
      // Standard + Android
      const el = container || video;
      const req = el?.requestFullscreen || el?.webkitRequestFullscreen || el?.mozRequestFullScreen || el?.msRequestFullscreen;
      if (req) {
        req.call(el);
        setIsFullscreen(true);
      }
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (exit) {
        exit.call(document);
        setIsFullscreen(false);
      }
    }
  };

  // Sync fullscreen state with browser events
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center py-10 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
          </div>
        ) : videos.length > 0 && currentVideo ? (
          <>
            {/* Title with Animation */}
            <div className="text-center mb-8">
              <h2
                className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                style={{ transitionDelay: '0.2s' }}
              >
                {currentVideo.title}
              </h2>
              <p
                className={`text-xl text-gray-300 max-w-3xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                style={{ transitionDelay: '0.4s' }}
              >
                {currentVideo.description}
              </p>
            </div>

            {/* Tabs for switching videos */}
            <div
              className={`flex flex-wrap justify-center gap-4 mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              style={{ transitionDelay: '0.5s' }}
            >
              {videos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => setActiveTab(index)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${activeTab === index
                    ? 'bg-[#024890] text-white shadow-lg scale-105'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                >
                  {video.tabLabel}
                </button>
              ))}
            </div>

            {/* Video Container with Custom Controls */}
            <div
              ref={containerRef}
              className={`relative rounded-2xl overflow-hidden shadow-2xl mb-8 sm:mb-16 transition-all duration-1000 bg-black ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
              style={{ transitionDelay: '0.7s' }}
            >
              <div className={`relative ${currentVideo.youtubeId ? 'aspect-video' : 'aspect-[9/16] sm:aspect-video'}`}>
                {currentVideo.youtubeId ? (
                  <YouTubeCustomPlayer
                    videoId={currentVideo.youtubeId}
                    title={currentVideo.title || 'Michigan English Placement Test video'}
                  />
                ) : (
                  <>
                    {/* Video Element */}
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                      onClick={togglePlay}
                      key={currentVideo.url} // Force reload on video switch
                    >
                      <source src={currentVideo.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>

                    {/* Play Button Overlay */}
                    {!isPlaying && (
                      <div
                        className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30 hover:bg-black/40 transition-all"
                        onClick={togglePlay}
                      >
                        <div className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110">
                          <svg className="w-10 h-10 text-[#024890] ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Custom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
                      {/* Progress Bar */}
                      <div
                        className="w-full h-1.5 bg-white/30 rounded-full mb-4 cursor-pointer hover:h-2 transition-all group"
                        onClick={handleSeek}
                      >
                        <div
                          className="h-full rounded-full transition-all group-hover:bg-[#f5b706]"
                          style={{
                            width: `${(currentTime / duration) * 100}%`,
                            backgroundColor: '#024890'
                          }}
                        >
                          <div className="w-3 h-3 bg-white rounded-full float-right -mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center justify-between">
                        {/* Left Controls */}
                        <div className="flex items-center gap-4">
                          {/* Play/Pause Button */}
                          <button
                            onClick={togglePlay}
                            className="text-white hover:text-[#f5b706] transition-colors"
                          >
                            {isPlaying ? (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>

                          {/* Volume Controls */}
                          <div className="flex items-center gap-2 group">
                            <button
                              onClick={toggleMute}
                              className="text-white hover:text-[#f5b706] transition-colors"
                            >
                              {isMuted || volume === 0 ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              ) : volume < 0.5 ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={volume}
                              onChange={handleVolumeChange}
                              className="w-0 group-hover:w-20 transition-all opacity-0 group-hover:opacity-100"
                              style={{
                                accentColor: '#024890'
                              }}
                            />
                          </div>

                          {/* Time Display */}
                          <div className="text-white text-sm font-medium">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </div>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-4">
                          {/* Fullscreen Button */}
                          <button
                            onClick={toggleFullscreen}
                            className="text-white hover:text-[#f5b706] transition-colors"
                          >
                            {isFullscreen ? (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </>
        ) : (
          <div className="text-center text-gray-400 py-10">No videos available</div>
        )}

        {/* Mobile Steps Timeline */}
        <div className="max-w-xl mx-auto mt-8 sm:mt-12 px-4 md:hidden">
          {[
            {
              number: 1,
              title: 'Create Account',
              desc: 'Register on our platform with your details',
              icon: UserPlus
            },
            {
              number: 2,
              title: 'Choose Test Date',
              desc: 'Select from available dates that suit you',
              icon: CalendarCheck
            },
            {
              number: 3,
              title: 'Complete Payment',
              desc: 'Pay securely and receive confirmation',
              icon: CreditCard
            }
          ].map((step, index, arr) => {
            const Icon = step.icon;
            const isLast = index === arr.length - 1;
            const isFirst = index === 0;

            return (
              <div
                key={index}
                className={`flex gap-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                style={{ transitionDelay: `${0.8 + (index * 0.2)}s` }}
              >
                {/* Timeline Column */}
                <div className="flex flex-col items-center self-stretch">
                  {/* Top Line */}
                  {!isFirst && <div className="w-px grow border-l-2 border-dashed border-blue-500/30"></div>}

                  {/* Number Circle (Centered) */}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 z-10 bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-400/30 my-2`}>
                    <span className="text-white font-bold text-base sm:text-lg">{step.number}</span>
                  </div>

                  {/* Bottom Line */}
                  {!isLast && <div className="w-px grow border-l-2 border-dashed border-blue-500/30"></div>}
                </div>

                {/* Content Column */}
                <div className="py-4 flex-1">
                  <div className="bg-[#111827] rounded-2xl p-4 border border-gray-800 flex items-center gap-4 shadow-lg h-full">
                    {/* Icon Box */}
                    <div className={`w-12 h-12 rounded-xl bg-gray-800/50 flex items-center justify-center shrink-0 border border-white/5`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Text */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">{step.title}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Steps Timeline (Zigzag/Snake Layout) */}
        <div className="hidden md:block max-w-6xl mx-auto mt-20 px-4 relative">
          <div className="relative">
            {/* Dashed Line Background - SVG */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 hidden lg:block" viewBox="0 0 1200 600" preserveAspectRatio="none">
              {/* Line from 1 to 2 */}
              <path d="M 300 150 L 900 150" fill="none" stroke="#024890" strokeWidth="2" strokeDasharray="12 12" />
              {/* Line from 2 to 3 (Down and Turn Left) */}
              <path d="M 900 150 L 900 350 Q 900 450 800 450 L 600 450" fill="none" stroke="#024890" strokeWidth="2" strokeDasharray="12 12" />
            </svg>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 relative z-10 pt-12">
              {/* Item 1 */}
              <div className={`relative ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'} transition-all duration-1000 delay-700`}>
                <div className="absolute -top-5 left-8 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold z-20 shadow-lg border-2 border-[#111827]">Step 1</div>
                <div className="bg-[#1f2937]/50 backdrop-blur-sm border border-gray-700 p-6 rounded-3xl flex gap-6 items-center hover:bg-[#1f2937] transition-colors h-full">
                  <div className="w-24 h-24 bg-gray-800 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                    <UserPlus className="w-10 h-10 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Create Account</h3>
                    <p className="text-gray-400 text-sm">Register on our platform with your personal details.</p>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className={`relative ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'} transition-all duration-1000 delay-900`}>
                <div className="absolute -top-5 left-8 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold z-20 shadow-lg border-2 border-[#111827]">Step 2</div>
                <div className="bg-[#1f2937]/50 backdrop-blur-sm border border-gray-700 p-6 rounded-3xl flex gap-6 items-center hover:bg-[#1f2937] transition-colors h-full">
                  <div className="w-24 h-24 bg-gray-800 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                    <CalendarCheck className="w-10 h-10 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Choose Test Date</h3>
                    <p className="text-gray-400 text-sm">Select the most convenient date for your exam.</p>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className={`relative lg:col-span-2 lg:w-1/2 lg:mx-auto ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} transition-all duration-1000 delay-1100`}>
                <div className="absolute -top-5 left-8 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold z-20 shadow-lg border-2 border-[#111827]">Step 3</div>
                <div className="bg-[#1f2937]/50 backdrop-blur-sm border border-gray-700 p-6 rounded-3xl flex gap-6 items-center hover:bg-[#1f2937] transition-colors h-full">
                  <div className="w-24 h-24 bg-gray-800 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                    <CreditCard className="w-10 h-10 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Complete Payment</h3>
                    <p className="text-gray-400 text-sm">Securely finalize your registration with payment.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section >
  );
};

export default VideoSection;
