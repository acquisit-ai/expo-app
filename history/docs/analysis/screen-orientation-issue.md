# 屏幕方向锁定问题分析

## 问题描述

**预期行为**: 除了 Fullscreen 页面外，所有页面都应该锁定竖屏
**实际行为**: Fullscreen 页面解锁后，退出到 Feed 所有页面都保持解锁状态

## 当前方向锁定逻辑

### 1. App 初始化 (src/app/App.tsx:88)
```typescript
// ✅ 应用启动时锁定竖屏
await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
```

### 2. VideoDetailPage (src/pages/video-detail/model/useVideoDetailLogic.ts:39-41)
```typescript
// ✅ Detail 页面挂载时锁定竖屏
useEffect(() => {
  await ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.PORTRAIT_UP
  );

  return () => {
    // ❌ 没有清理逻辑
  };
}, []);
```

### 3. VideoFullscreenPage (src/pages/video-fullscreen/model/useVideoFullscreenLogic.ts:44)
```typescript
// 🔓 Fullscreen 页面挂载时解锁方向
useEffect(() => {
  await ScreenOrientation.unlockAsync();

  return () => {
    // ❌ 问题：卸载时没有恢复竖屏锁定！
    mounted = false;
  };
}, []);
```

### 4. FullscreenLandscapeLayout (src/features/video-core-controls/ui/layouts/FullscreenLandscapeLayout.tsx:76)
```typescript
// ✅ 横屏布局返回时锁定竖屏
const handleBackPress = async () => {
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  // ... 继续处理返回
};
```

## 问题根源

### 核心问题：Fullscreen 页面卸载时未恢复方向锁定

```
Flow 分析：

1. App 启动
   └─ lockAsync(PORTRAIT_UP) ✅ 全局锁定竖屏

2. Feed → Fullscreen
   └─ unlockAsync() 🔓 解锁方向（允许横竖屏）

3. Fullscreen → Feed (问题发生)
   └─ useEffect cleanup
       └─ ❌ 只设置 mounted = false
       └─ ❌ 没有调用 lockAsync(PORTRAIT_UP)

4. 结果
   └─ Feed 页面及所有其他页面保持解锁状态 ❌
```

## 导航流程与方向锁定

### 场景 1: Feed → Fullscreen → Feed

```
[Feed] (锁定竖屏)
  ↓ 点击视频
[Fullscreen] unlockAsync() 🔓
  ↓ 用户按返回
[Feed] ❌ 仍然解锁状态 (问题！)
```

### 场景 2: Feed → Fullscreen → Detail → Feed

```
[Feed] (锁定竖屏)
  ↓
[Fullscreen] unlockAsync() 🔓
  ↓ exitFullscreen
[Detail] lockAsync(PORTRAIT_UP) ✅
  ↓ 用户按返回
[Feed] ✅ 竖屏锁定 (正常)
```

**关键发现**: 只有通过 Detail 页面返回才会恢复竖屏锁定！

### 场景 3: Feed → Fullscreen (横屏) → Feed

```
[Feed] (锁定竖屏)
  ↓
[Fullscreen] unlockAsync() 🔓
  ↓ 用户旋转到横屏
[Fullscreen Landscape]
  ↓ FullscreenLandscapeLayout.handleBackPress
  └─ lockAsync(PORTRAIT_UP) ✅
  ↓
[Feed] ✅ 竖屏锁定 (正常)
```

**发现**: 横屏布局的返回按钮会恢复竖屏锁定！

## 三种返回路径对比

| 返回路径 | 方向锁定恢复 | 原因 |
|----------|-------------|------|
| Fullscreen (竖屏) → Feed | ❌ 未恢复 | useVideoFullscreenLogic 没有恢复逻辑 |
| Fullscreen → Detail → Feed | ✅ 已恢复 | Detail 页面挂载时执行 lockAsync |
| Fullscreen (横屏) → Feed | ✅ 已恢复 | FullscreenLandscapeLayout 返回时执行 lockAsync |

## 为什么 Detail 页面能恢复？

```typescript
// src/pages/video-detail/model/useVideoDetailLogic.ts:39-41
useEffect(() => {
  await ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.PORTRAIT_UP
  );
}, []);
```

Detail 页面**挂载时**主动锁定竖屏，所以当用户通过 Detail 返回时，方向已经被恢复。

## 为什么横屏布局能恢复？

```typescript
// src/features/video-core-controls/ui/layouts/FullscreenLandscapeLayout.tsx:76
const handleBackPress = async () => {
  await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  // ... 继续处理返回
};
```

横屏布局的返回按钮**在执行返回前**主动锁定竖屏。

## 解决方案对比

### 方案 1: Fullscreen 卸载时恢复竖屏 ⭐ **推荐**

#### 优点
- ✅ 在问题源头解决
- ✅ 无论从哪个路径返回都能恢复
- ✅ 逻辑清晰：进入解锁，退出锁定

#### 缺点
- ⚠️ cleanup 函数中的异步操作可能不可靠

#### 实现方案

```typescript
// src/pages/video-fullscreen/model/useVideoFullscreenLogic.ts
useEffect(() => {
  let mounted = true;

  const unlockOrientation = async () => {
    try {
      await ScreenOrientation.unlockAsync();
      if (mounted) {
        log(LOG_TAG, LogType.INFO, 'Orientation unlocked for fullscreen');
      }
    } catch (error) {
      if (mounted) {
        log(LOG_TAG, LogType.WARNING, `Failed to unlock orientation: ${error}`);
      }
    }
  };

  unlockOrientation();

  return () => {
    mounted = false;

    // 🆕 卸载时恢复竖屏锁定
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    ).catch((error) => {
      log(LOG_TAG, LogType.WARNING, `Failed to lock orientation on cleanup: ${error}`);
    });
  };
}, []);
```

---

### 方案 2: backToFeed 时恢复竖屏

#### 优点
- ✅ 在导航前恢复，更可靠
- ✅ 可以等待锁定完成后再导航

#### 缺点
- ❌ 只处理了 backToFeed 路径
- ❌ 横屏布局的返回按钮也需要单独处理
- ❌ 如果有其他返回方式需要逐个处理

#### 实现方案

```typescript
// src/pages/video-fullscreen/model/useVideoFullscreenLogic.ts
const backToFeed = useCallback(async () => {
  log(LOG_TAG, LogType.INFO, 'Navigating back to feed');

  // 🆕 返回前恢复竖屏锁定
  try {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
    log(LOG_TAG, LogType.INFO, 'Orientation locked before navigating back');
  } catch (error) {
    log(LOG_TAG, LogType.WARNING, `Failed to lock orientation: ${error}`);
  }

  // 关闭整个 VideoStack
  const parent = navigation.getParent();
  if (parent) {
    parent.goBack();
  }
}, [navigation]);
```

---

### 方案 3: Feed 页面获得焦点时恢复竖屏

#### 优点
- ✅ 在目标页面统一处理
- ✅ 无论从哪个路径返回都能恢复

#### 缺点
- ❌ 响应不及时（页面已经显示后才锁定）
- ❌ 可能造成短暂的方向闪烁
- ❌ Feed 页面承担了不属于它的职责

#### 实现方案

```typescript
// src/pages/feed/ui/FeedPage.tsx
import * as ScreenOrientation from 'expo-screen-orientation';

useFocusEffect(
  useCallback(() => {
    // 🆕 页面获得焦点时恢复竖屏锁定
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    ).catch((error) => {
      log('feed-page', LogType.WARNING, `Failed to lock orientation: ${error}`);
    });

    setIsPageFocused(true);
    // ...
  }, [])
);
```

---

### 方案 4: 全局导航监听器

#### 优点
- ✅ 集中管理，统一处理
- ✅ 可以处理所有页面的方向锁定

#### 缺点
- ❌ 过度设计，增加复杂度
- ❌ 需要维护页面与方向锁定的映射关系
- ❌ 不符合局部管理的原则

#### 实现方案（不推荐）

```typescript
// src/app/navigation/RootNavigator.tsx
import { useNavigationState } from '@react-navigation/native';

export function RootNavigator() {
  const currentRoute = useNavigationState(state =>
    state.routes[state.index]?.name
  );

  useEffect(() => {
    if (currentRoute === 'VideoFullscreen') {
      ScreenOrientation.unlockAsync();
    } else {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    }
  }, [currentRoute]);

  // ...
}
```

## 推荐方案详细分析

### 方案 1: Fullscreen 卸载时恢复竖屏 (推荐)

#### 为什么推荐？

1. **问题源头解决**: 在 Fullscreen 解锁的地方负责恢复
2. **单一职责**: Fullscreen 管理自己的方向状态
3. **覆盖全面**: 无论通过哪种方式退出都能恢复
4. **逻辑清晰**: 进入解锁 → 退出锁定，成对出现

#### 潜在问题：cleanup 中的异步操作

**React 文档警告**: cleanup 函数中的异步操作可能在组件卸载后才完成

**解决方案**:
- 使用 `fire-and-forget` 模式（不等待结果）
- 添加错误处理（catch）
- expo-screen-orientation 的 API 是安全的，即使组件卸载也能正常执行

#### 完整实现

```typescript
// src/pages/video-fullscreen/model/useVideoFullscreenLogic.ts
useEffect(() => {
  let mounted = true;

  const unlockOrientation = async () => {
    try {
      await ScreenOrientation.unlockAsync();
      if (mounted) {
        log(LOG_TAG, LogType.INFO, 'Orientation unlocked for fullscreen');
      }
    } catch (error) {
      if (mounted) {
        log(LOG_TAG, LogType.WARNING, `Failed to unlock orientation: ${error}`);
      }
    }
  };

  unlockOrientation();

  // 🎯 清理函数：恢复竖屏锁定
  return () => {
    mounted = false;

    // Fire-and-forget: 不等待结果，添加错误处理
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    ).then(() => {
      log(LOG_TAG, LogType.INFO, 'Orientation locked on fullscreen unmount');
    }).catch((error) => {
      log(LOG_TAG, LogType.WARNING, `Failed to lock orientation on cleanup: ${error}`);
    });
  };
}, []);
```

## 测试场景

### 场景 1: Feed → Fullscreen (竖屏) → Feed
```
操作：
1. 在 Feed 点击视频
2. 进入 Fullscreen（保持竖屏）
3. 点击返回按钮

预期：
- Feed 页面应该锁定竖屏
- 无法通过旋转设备切换到横屏

验证：
查看日志 "Orientation locked on fullscreen unmount"
```

### 场景 2: Feed → Fullscreen (横屏) → Feed
```
操作：
1. 在 Feed 点击视频
2. 进入 Fullscreen
3. 旋转设备到横屏
4. 点击返回按钮（横屏布局的返回）

预期：
- Feed 页面应该锁定竖屏
- 设备自动旋转回竖屏

验证：
查看日志 "Locked orientation to portrait" (FullscreenLandscapeLayout)
查看日志 "Orientation locked on fullscreen unmount"
```

### 场景 3: Feed → Fullscreen → Detail → Feed
```
操作：
1. 在 Feed 点击视频
2. 进入 Fullscreen
3. 点击退出全屏（进入 Detail）
4. 点击返回（返回 Feed）

预期：
- Feed 页面应该锁定竖屏
- Detail 和 Feed 都无法横屏

验证：
查看日志 "Orientation locked to portrait" (Detail 挂载)
查看日志 "Orientation locked on fullscreen unmount"
```

## 补充方案：双重保险

为了确保方向锁定万无一失，可以结合方案 1 和方案 3：

```typescript
// 方案 1: Fullscreen 卸载时恢复（主要方案）
useEffect(() => {
  // ... 解锁逻辑

  return () => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
  };
}, []);

// 方案 3: Feed 获得焦点时确保锁定（保险方案）
useFocusEffect(
  useCallback(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
  }, [])
);
```

这样即使 cleanup 函数失败，Feed 页面也能自己恢复竖屏锁定。

## 总结

### 问题本质
Fullscreen 页面解锁方向后，卸载时没有恢复竖屏锁定，导致所有页面都保持解锁状态。

### 推荐解决方案
**方案 1**: 在 Fullscreen 页面的 useEffect cleanup 中恢复竖屏锁定

### 理由
- 问题源头解决
- 逻辑清晰（进入解锁，退出锁定）
- 覆盖所有返回路径
- 符合单一职责原则

### 实施文件
`src/pages/video-fullscreen/model/useVideoFullscreenLogic.ts`
