初始化 17 个 instance：13 个主 pool 只能是已完成的,未锁的(replaceAsync 要么成功要么失败的)
4 个 available pool，一定 videoSource 都是 null， 可以锁,用以换源、解锁后，替换主 pool 资源，每次都拿主 pool 第一个换(LRU)
删除 requestQueue

feed list 停下后一次 load3 个, 选择两个 pool 都没有的视频 preload,每次都从 available pool 拿实例,如果全部上锁则直接摒弃这次请求
其他逻辑相同,比如 preload/acquire 到主 pool 已存在的则 delete 再 add 维护 lru;preload/acquire 到 available pool 的直接返回实例,因为迟早会进入主 pool 末尾

# 2 个管理模式:

需要设置一个 available pool 清理状态,直到 available pool 为全 null
两个模式切换的时候需要清理 available pool, 即: 如果现在 available pool 有正在换源的(锁住的),完成后(解锁后)不进入主池,而是直接 replaceAsync(null)清理掉.

## 当前模式

专为 feedpage 页面提前缓存设计
回到 feedpage 时设置标志位

1. 在 feedpage 页面时:feed list 模式,也就是当前模式,功能没有变化.available pool 流式进入主 pool

## 新模式

专为播放页面设计

未来希望进入播放页面后,视频能够如 tiktok 一样上下滑动切换,为此做准备
以主 pool 为一个 13 个视频的可滑动窗口

2. 在视频播放页面时:fullscreen 模式.
   点击进入视频页面时
   a. 以点击视频上下 6 个为窗口,如果 feedlist index=0-6 则都为[0,12],feedlist index= 7 则为[1,13]直接替换 13 个主 pool(从小到大依次替换,如果有缓存视频还是留下)
