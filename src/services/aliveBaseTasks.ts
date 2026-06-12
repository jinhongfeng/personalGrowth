import type { AliveRecommendationCard, AliveStatus, AliveTimeAvailable } from '@/types'

interface AliveTaskTemplate {
  title: string
  desc: string
  time: string
  tag: string
}

const aliveStatuses: AliveStatus[] = ['low-energy', 'can-move', 'want-recover']

const statusTaskProfiles: Record<AliveStatus, { titlePrefix: string; descSuffix: string }> = {
  'low-energy': {
    titlePrefix: '',
    descSuffix: '只完成这个动作即可，不需要继续加码。',
  },
  'can-move': {
    titlePrefix: '加一点：',
    descSuffix: '如果状态允许，结束后多做一个很小的收尾。',
  },
  'want-recover': {
    titlePrefix: '恢复节奏：',
    descSuffix: '做完后记录一句下一步，让恢复感延续。',
  },
}

const baseTaskTemplates: Record<AliveTimeAvailable, { indoor: AliveTaskTemplate[]; outdoor: AliveTaskTemplate[] }> = {
  '5min': {
    indoor: [
      { title: '喝水并开窗 5 分钟', desc: '倒一杯水，打开窗户站一会儿。只让身体先收到一个清醒信号。', time: '5 分钟', tag: '基础需求' },
      { title: '洗脸换个状态 3 分钟', desc: '去洗一把脸，顺手把台面擦干。用一个很小的动作切换状态。', time: '3 分钟', tag: '身体唤醒' },
      { title: '肩颈放松 4 分钟', desc: '慢慢转肩、低头、抬头，不追求标准。让身体紧绷感先下降一点。', time: '4 分钟', tag: '身体放松' },
      { title: '整理桌面一角 5 分钟', desc: '只处理眼前一小块区域，把明显碍眼的东西放回原位，时间到就停。', time: '5 分钟', tag: '环境整理' },
      { title: '听完一首歌 5 分钟', desc: '选一首熟悉的歌，坐着听完。不要顺手刷别的内容，只让脑袋缓一下。', time: '5 分钟', tag: '情绪调节' },
    ],
    outdoor: [
      { title: '到门口晒 5 分钟', desc: '走到楼下、门口或楼道口，看一会儿天光。只完成出门这一步就好。', time: '5 分钟', tag: '身体唤醒' },
      { title: '楼下站一会儿 5 分钟', desc: '站到楼下安全的位置，做 5 次慢呼吸。目标是换个空气，不是运动。', time: '5 分钟', tag: '环境切换' },
      { title: '出门丢垃圾 5 分钟', desc: '拿一袋垃圾出门扔掉，回来就结束。用一个有结果的小动作启动自己。', time: '5 分钟', tag: '行动启动' },
      { title: '楼道慢走 5 分钟', desc: '在楼道或楼下慢慢走几圈，不追求步数。让身体知道今天还可以移动。', time: '5 分钟', tag: '身体唤醒' },
      { title: '门口买一瓶水 5 分钟', desc: '如果附近很近，只买一瓶水就回来。目标很小，完成即可。', time: '5 分钟', tag: '轻出门' },
    ],
  },
  '15min': {
    indoor: [
      { title: '整理一小块 10 分钟', desc: '只选桌面、床头或地面的一小块。把物品归位，别扩大范围。', time: '10 分钟', tag: '环境整理' },
      { title: '轻拉伸 10 分钟', desc: '从肩颈、背部到腿部轻轻拉伸。动作慢一点，重点是放松。', time: '10 分钟', tag: '身体放松' },
      { title: '煮一杯热饮 10 分钟', desc: '给自己倒水、泡茶或热牛奶。先照顾身体，再考虑别的事。', time: '10 分钟', tag: '基础需求' },
      { title: '清理通知 10 分钟', desc: '只关闭、归档或删除最打扰你的通知，不继续刷内容。', time: '10 分钟', tag: '环境整理' },
      { title: '写五行状态 12 分钟', desc: '写下身体感受、情绪、最卡的事、能做的一步、做完的小奖励。', time: '12 分钟', tag: '认知恢复' },
    ],
    outdoor: [
      { title: '楼下慢走 10 分钟', desc: '沿熟悉路线走一小圈，不追求速度，回来后喝水休息。', time: '10 分钟', tag: '身体唤醒' },
      { title: '便利店往返 15 分钟', desc: '只买水或一份小食，路线越简单越好。完成一次轻出门即可。', time: '15 分钟', tag: '轻出门' },
      { title: '小区转一圈 12 分钟', desc: '走到小区或楼下安全区域转一圈，观察三个你看到的东西。', time: '12 分钟', tag: '环境切换' },
      { title: '找阳光处站 10 分钟', desc: '走到有自然光的位置站一会儿，慢慢呼吸，让身体先醒一点。', time: '10 分钟', tag: '自然疗愈' },
      { title: '户外深呼吸 8 分钟', desc: '到门口或楼下做几轮慢呼吸，注意脚踩地面的感觉。', time: '8 分钟', tag: '情绪调节' },
    ],
  },
  '30min': {
    indoor: [
      { title: '洗澡换衣 25 分钟', desc: '洗个澡，换一身干净衣服。把恢复状态先落到身体上。', time: '25 分钟', tag: '基础需求' },
      { title: '做 20 分钟专注块', desc: '选一件最小任务，开计时器 20 分钟。只要求开始，不要求彻底解决。', time: '20 分钟', tag: '专注恢复' },
      { title: '收拾一个角落 25 分钟', desc: '只处理一个角落，明显变整洁就停。不要顺手开启大扫除。', time: '25 分钟', tag: '环境整理' },
      { title: '做一份轻食 25 分钟', desc: '准备水果、酸奶、热汤或简单主食。先让身体有一点补给。', time: '25 分钟', tag: '基础需求' },
      { title: '写短复盘 20 分钟', desc: '写下最近最卡的一件事、下一步和今天能完成的最小版本。', time: '20 分钟', tag: '认知恢复' },
    ],
    outdoor: [
      { title: '附近走一圈 25 分钟', desc: '走到一个熟悉地点再回来，用环境变化把自己从原地带出来。', time: '25 分钟', tag: '自然疗愈' },
      { title: '小区慢走 20 分钟', desc: '选择安全熟悉的路线，保持能说话的速度，走完就回。', time: '20 分钟', tag: '身体唤醒' },
      { title: '买水果往返 25 分钟', desc: '只买一种水果或小食，别临时加任务。完成这次出门就好。', time: '25 分钟', tag: '轻出门' },
      { title: '找长椅坐一会儿 25 分钟', desc: '走到附近能坐的位置，坐几分钟再回来。给大脑一点空间。', time: '25 分钟', tag: '情绪调节' },
      { title: '去附近绿地走 30 分钟', desc: '如果附近有绿地，慢慢走一圈。注意风、光线和脚步。', time: '30 分钟', tag: '自然疗愈' },
    ],
  },
  '1hour': {
    indoor: [
      { title: '轻整理 45 分钟', desc: '设一个计时，只整理一个区域。结束时保留一点余力，不追求一次弄完。', time: '45 分钟', tag: '环境整理' },
      { title: '做饭和收尾 45 分钟', desc: '做一份简单饭，顺手把台面收干净。让身体和环境一起回到可用状态。', time: '45 分钟', tag: '基础需求' },
      { title: '深度复盘 40 分钟', desc: '写下近期阻力、可调整的一个变量、下一步和明天第一件事。', time: '40 分钟', tag: '认知恢复' },
      { title: '洗衣整理 45 分钟', desc: '处理一小批衣物，收好眼前最影响心情的部分，时间到就停。', time: '45 分钟', tag: '环境整理' },
      { title: '阅读休息 40 分钟', desc: '选轻松内容读一会儿，中途不切到短视频。让注意力慢慢回来。', time: '40 分钟', tag: '专注恢复' },
    ],
    outdoor: [
      { title: '公园走坐 45 分钟', desc: '走到附近公园或空地，坐一会儿再回来。给大脑一点空间。', time: '45 分钟', tag: '自然疗愈' },
      { title: '便利店路线 40 分钟', desc: '选一条简单路线，只买一样东西。重点是完成一次有边界的出门。', time: '40 分钟', tag: '轻出门' },
      { title: '附近快走 45 分钟', desc: '保持能说话的速度快走，回来后喝水休息，不继续加练。', time: '45 分钟', tag: '身体唤醒' },
      { title: '安静处坐 50 分钟', desc: '去一个安全安静的位置坐一会儿，整理思路或只是发呆。', time: '50 分钟', tag: '情绪调节' },
      { title: '远一点散步 50 分钟', desc: '走一条稍远但熟悉的路线，途中不赶路，回来后做一个小收尾。', time: '50 分钟', tag: '自然疗愈' },
    ],
  },
}

export function getBaseAliveTasks(): AliveRecommendationCard[] {
  return Object.entries(baseTaskTemplates).flatMap(([timeAvailable, groups]) =>
    aliveStatuses.flatMap(status =>
      (['indoor', 'outdoor'] as const).flatMap(place =>
        groups[place].map((task, index) => {
          const profile = statusTaskProfiles[status]
          return {
            id: `base:${status}:${timeAvailable}:${place}:${index + 1}`,
            ...task,
            title: `${profile.titlePrefix}${task.title}`,
            desc: `${task.desc}${profile.descSuffix}`,
            minTime: timeAvailable as AliveTimeAvailable,
            needGoOut: place === 'outdoor',
            minStatus: status,
            source: 'local' as const,
          }
        }),
      ),
    ),
  )
}

export function getBaseAliveTasksForFilters(
  filters: { status: AliveStatus; timeAvailable: AliveTimeAvailable; canGoOut: boolean },
  minCount = 5,
) {
  return getBaseAliveTasks()
    .filter(task =>
      task.minTime === filters.timeAvailable &&
      task.needGoOut === filters.canGoOut &&
      task.minStatus === filters.status,
    )
    .slice(0, minCount)
}
