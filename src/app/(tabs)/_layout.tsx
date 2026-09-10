import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { T } from '@/constants/strings';

/**
 * Natív iOS tabbar. Az ikonok SF Symbols nevek, így nincs szükség képfájlokra.
 */
export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{T.tabs.workouts}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'list.bullet.rectangle', selected: 'list.bullet.rectangle.fill' }}
          md="format_list_bulleted"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="templates">
        <NativeTabs.Trigger.Label>{T.tabs.templates}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'square.stack', selected: 'square.stack.fill' }}
          md="dashboard"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="exercises">
        <NativeTabs.Trigger.Label>{T.tabs.exercises}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'dumbbell', selected: 'dumbbell.fill' }}
          md="fitness_center"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>{T.tabs.progress}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.xyaxis.line', selected: 'chart.xyaxis.line' }}
          md="show_chart"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
