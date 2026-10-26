import { Tabs, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Briefcase, User, WalletCards, Sparkles, Plus } from 'lucide-react-native';
import { COLORS, FONTS } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function TabsLayout() {
  const { role } = useApp();
  const isEmployer = role === 'employer';
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const currentScreen = pathname.split('/').pop();
    const employerScreens = ['home', 'post-job', 'workers', 'my-jobs'];
    const workerScreens = ['jobs', 'ai', 'wallet'];

    if (isEmployer && workerScreens.includes(currentScreen ?? '')) {
      router.replace('/(tabs)/home');
    }
    if (!isEmployer && employerScreens.includes(currentScreen ?? '')) {
      router.replace('/(tabs)/jobs');
    }
  }, [isEmployer, pathname, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: 12,
        },
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          href: isEmployer ? '/(tabs)/home' : null,
          tabBarIcon: ({ color }) => <Briefcase size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="post-job"
        options={{
          title: 'Post a Job',
          href: isEmployer ? '/(tabs)/post-job' : null,
          tabBarIcon: ({ color }) => <Plus size={24} color={color} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="workers"
        options={{
          title: 'Find Workers',
          href: isEmployer ? '/(tabs)/workers' : null,
          tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="my-jobs"
        options={{
          title: 'My Jobs',
          href: isEmployer ? '/(tabs)/my-jobs' : null,
          tabBarIcon: ({ color }) => <WalletCards size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          href: isEmployer ? null : '/(tabs)/jobs',
          tabBarIcon: ({ color }) => <Briefcase size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Yenza-AI',
          href: isEmployer ? null : '/(tabs)/ai',
          tabBarIcon: ({ color }) => <Sparkles size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Earnings',
          href: isEmployer ? null : '/(tabs)/wallet',
          tabBarIcon: ({ color }) => <WalletCards size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: '/(tabs)/profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
