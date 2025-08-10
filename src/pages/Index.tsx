import StatsCards from "@/components/dashboard/StatsCards";
import Globe from "@/components/dashboard/Globe";
import ConjunctionTable from "@/components/dashboard/ConjunctionTable";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/components/auth/AuthProvider";

const Index = () => {
  const { user } = useAuth();
  
  // Get user's display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.user_metadata?.display_name || 
           user.user_metadata?.full_name || 
           user.email?.split('@')[0] || 
           'User';
  };
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Orbital Guardian – Space Debris Monitoring Dashboard</title>
        <meta name="description" content="Real-time space debris monitoring, collision alerts, and conjunction insights on a 3D globe." />
        <link rel="canonical" href="/" />
      </Helmet>

      {/* Main content */}
      <main className="container py-6">
        <div className="text-center mb-8">
          {/* Personalized greeting */}
          <div className="mb-4">
            <p className="text-lg text-muted-foreground mb-1">
              {getGreeting()}, {getUserDisplayName()}!
            </p>
            <p className="text-sm text-muted-foreground">
              Welcome back to your space monitoring dashboard
            </p>
          </div>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Orbital Guardian
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            AI-Powered Space Debris Monitoring & Collision Prevention
          </p>
          <p className="text-sm text-muted-foreground">
            Real-time tracking • Predictive analytics • Automated alerts • Mission safety
          </p>
        </div>
        <StatsCards />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Globe />
            <ConjunctionTable />
          </div>
          <aside className="lg:col-span-1">
            <AlertsPanel />
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Index;
