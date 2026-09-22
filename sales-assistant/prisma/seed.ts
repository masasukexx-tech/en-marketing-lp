import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000);

async function main() {
  console.log("シードデータを投入します...");

  await prisma.followUp.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.messageDraft.deleteMany();
  await prisma.profileAnalysis.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.company.deleteMany();
  await prisma.appSetting.deleteMany();

  await prisma.appSetting.create({
    data: { key: "en_company_name", value: "株式会社EN" },
  });

  // ---- 1. 経営者（顧客候補・優先度A・商談化まで進んだケース） ----
  const companyA = await prisma.company.create({
    data: { name: "株式会社サンプルワークス", industry: "IT・Web制作" },
  });

  const leadA = await prisma.lead.create({
    data: {
      linkedinUrl: "https://www.linkedin.com/in/sample-yamada",
      name: "山田 太郎",
      companyName: companyA.name,
      companyId: companyA.id,
      title: "代表取締役CEO",
      industry: "IT・Web制作",
      location: "東京都",
      profileText:
        "Web制作会社を創業して8年。最近は採用ブランディングとSNSを活用した新規事業立ち上げに注力しています。",
      workHistory: "大手SIer → Web制作会社創業（2017年〜）",
      recentPosts:
        "先週、自社の採用ページリニューアルとTikTok運用開始について投稿していた。",
      notes: "知人の紹介で接点あり。",
      source: "紹介",
      status: "MEETING",
      overallScore: 88,
      customerScore: 90,
      partnerScore: 60,
      priority: "A",
      isCustomerLead: true,
      isPartnerLead: false,
      nextActionDate: daysFromNow(3),
      createdAt: daysAgo(20),
    },
  });

  await prisma.profileAnalysis.create({
    data: {
      leadId: leadA.id,
      overallScore: 88,
      customerScore: 90,
      partnerScore: 60,
      priority: "A",
      reasons: JSON.stringify([
        "代表取締役という意思決定者であり、採用ブランディングとSNS活用に明確な関心がある可能性があります",
        "新規事業立ち上げに言及しており、認知獲得の導線設計ニーズと合致します",
      ]),
      painPoints: JSON.stringify([
        "採用ページはリニューアルしたが、SNS経由の応募導線が弱い可能性があります",
        "TikTok運用を始めたばかりで、戦略的な運用ノウハウが不足している可能性があります",
      ]),
      valueProps: JSON.stringify([
        "採用向けSNS支援による応募導線の一気通貫設計",
        "TikTok運用の戦略立案から実行までの伴走支援",
      ]),
      talkingPoints: JSON.stringify([
        "採用ページリニューアルの投稿内容",
        "TikTok運用開始の狙い",
      ]),
      cautions: null,
      missingInfo: JSON.stringify([]),
      suggestedInfo: JSON.stringify(["直近の採用人数や目標KPI"]),
      genericWarning: false,
      rawResponse: JSON.stringify({ seed: true }),
      modelUsed: "seed-mock",
      createdAt: daysAgo(19),
    },
  });

  const connReqA = await prisma.messageDraft.create({
    data: {
      leadId: leadA.id,
      type: "CONNECTION_REQUEST",
      variant: "collab",
      label: "協業可能性を感じさせる文面",
      content:
        "山田様、はじめまして。採用ページリニューアルとTikTok運用開始の投稿を拝見しました。SNSを起点にした採用・集客の導線設計を支援しており、貴社の新規事業の取り組みにも関心があります。よろしければ繋がらせてください。",
      profileSnapshot: JSON.stringify({ name: leadA.name, companyName: leadA.companyName }),
      editedContent: null,
      adopted: true,
      modelUsed: "seed-mock",
      createdAt: daysAgo(18),
    },
  });

  const dmA = await prisma.messageDraft.create({
    data: {
      leadId: leadA.id,
      type: "FIRST_DM",
      variant: "hypothesis",
      label: "課題仮説型",
      content:
        "山田様\n\nつながっていただきありがとうございます。採用ページのリニューアルとTikTok運用開始、拝見しておりました。新規事業の立ち上げに合わせて認知獲得に力を入れていらっしゃる印象を受けています。\n\n私は株式会社ENでSNSを起点とした集客・採用支援を行っており、TikTok運用は戦略設計から伴走することを得意としています。\n\n差し支えなければ、TikTok運用は社内で完結されているのか、外部パートナーも検討されているのか伺えますでしょうか。もしご興味があれば、15分ほどお話しできればと思います。",
      profileSnapshot: JSON.stringify({ name: leadA.name, companyName: leadA.companyName }),
      editedContent: null,
      adopted: true,
      modelUsed: "seed-mock",
      createdAt: daysAgo(14),
    },
  });

  await prisma.activity.createMany({
    data: [
      { leadId: leadA.id, type: "ANALYSIS", toStatus: null, content: "相性判定を実施（総合88点/A）", createdAt: daysAgo(19) },
      { leadId: leadA.id, type: "STATUS_CHANGE", fromStatus: "CANDIDATE", toStatus: "REVIEWED", createdAt: daysAgo(19) },
      { leadId: leadA.id, type: "STATUS_CHANGE", fromStatus: "REVIEWED", toStatus: "APPROVED", createdAt: daysAgo(19) },
      { leadId: leadA.id, type: "MESSAGE_GENERATED", content: `つながり申請文を生成 (draft:${connReqA.id})`, createdAt: daysAgo(18) },
      { leadId: leadA.id, type: "STATUS_CHANGE", fromStatus: "APPROVED", toStatus: "REQUEST_SENT", createdAt: daysAgo(18) },
      { leadId: leadA.id, type: "STATUS_CHANGE", fromStatus: "REQUEST_SENT", toStatus: "CONNECTED", createdAt: daysAgo(15) },
      { leadId: leadA.id, type: "MESSAGE_GENERATED", content: `初回DMを生成 (draft:${dmA.id})`, createdAt: daysAgo(14) },
      { leadId: leadA.id, type: "STATUS_CHANGE", fromStatus: "CONNECTED", toStatus: "DM_DRAFTED", createdAt: daysAgo(14) },
      { leadId: leadA.id, type: "STATUS_CHANGE", fromStatus: "DM_DRAFTED", toStatus: "DM_SENT", createdAt: daysAgo(13) },
      { leadId: leadA.id, type: "REPLY", content: "ちょうどTikTok運用のパートナーを探していました。一度お話ししましょう。", createdAt: daysAgo(11) },
      { leadId: leadA.id, type: "STATUS_CHANGE", fromStatus: "DM_SENT", toStatus: "REPLIED", createdAt: daysAgo(11) },
      { leadId: leadA.id, type: "STATUS_CHANGE", fromStatus: "REPLIED", toStatus: "SCHEDULING", createdAt: daysAgo(9) },
      { leadId: leadA.id, type: "STATUS_CHANGE", fromStatus: "SCHEDULING", toStatus: "MEETING", createdAt: daysAgo(5) },
    ],
  });

  await prisma.followUp.create({
    data: {
      leadId: leadA.id,
      dueDate: daysFromNow(3),
      memo: "初回商談。提案資料を準備する。",
      done: false,
      createdAt: daysAgo(5),
    },
  });

  // ---- 2. マーケティング責任者（顧客候補・優先度A・DM送信後返信待ち） ----
  const companyB = await prisma.company.create({
    data: { name: "株式会社ネクストブランド", industry: "アパレル・EC" },
  });

  const leadB = await prisma.lead.create({
    data: {
      linkedinUrl: "https://www.linkedin.com/in/sample-suzuki",
      name: "鈴木 花子",
      companyName: companyB.name,
      companyId: companyB.id,
      title: "マーケティング責任者",
      industry: "アパレル・EC",
      location: "大阪府",
      profileText: "D2Cブランドのマーケティングを統括。Instagramでの世界観づくりに課題を感じている。",
      workHistory: "広告代理店 → D2Cブランドのマーケティング責任者",
      recentPosts: "Instagramのエンゲージメント低下について投稿。",
      notes: "",
      source: "LinkedIn検索",
      status: "DM_SENT",
      overallScore: 79,
      customerScore: 82,
      partnerScore: 40,
      priority: "A",
      isCustomerLead: true,
      isPartnerLead: false,
      nextActionDate: daysFromNow(2),
      createdAt: daysAgo(10),
    },
  });

  await prisma.profileAnalysis.create({
    data: {
      leadId: leadB.id,
      overallScore: 79,
      customerScore: 82,
      partnerScore: 40,
      priority: "A",
      reasons: JSON.stringify([
        "マーケティング責任者として意思決定に関与しており、Instagram運用に課題感を持っている可能性があります",
      ]),
      painPoints: JSON.stringify(["Instagramのエンゲージメント低下に悩んでいる可能性があります"]),
      valueProps: JSON.stringify(["Instagram運用とSNSマーケティング戦略の両面支援"]),
      talkingPoints: JSON.stringify(["エンゲージメント低下に関する投稿内容"]),
      cautions: null,
      missingInfo: JSON.stringify([]),
      suggestedInfo: JSON.stringify(["現在の運用体制（内製/代理店）"]),
      genericWarning: false,
      rawResponse: JSON.stringify({ seed: true }),
      modelUsed: "seed-mock",
      createdAt: daysAgo(9),
    },
  });

  await prisma.activity.createMany({
    data: [
      { leadId: leadB.id, type: "STATUS_CHANGE", fromStatus: "CANDIDATE", toStatus: "REVIEWED", createdAt: daysAgo(9) },
      { leadId: leadB.id, type: "STATUS_CHANGE", fromStatus: "REVIEWED", toStatus: "APPROVED", createdAt: daysAgo(9) },
      { leadId: leadB.id, type: "STATUS_CHANGE", fromStatus: "APPROVED", toStatus: "REQUEST_SENT", createdAt: daysAgo(8) },
      { leadId: leadB.id, type: "STATUS_CHANGE", fromStatus: "REQUEST_SENT", toStatus: "CONNECTED", createdAt: daysAgo(6) },
      { leadId: leadB.id, type: "STATUS_CHANGE", fromStatus: "CONNECTED", toStatus: "DM_DRAFTED", createdAt: daysAgo(4) },
      { leadId: leadB.id, type: "STATUS_CHANGE", fromStatus: "DM_DRAFTED", toStatus: "DM_SENT", createdAt: daysAgo(3) },
    ],
  });

  // ---- 3. 広告代理店の営業責任者（協業候補・優先度B・接続済み） ----
  const companyC = await prisma.company.create({
    data: { name: "アドプロモーション株式会社", industry: "広告代理店" },
  });

  const leadC = await prisma.lead.create({
    data: {
      linkedinUrl: "https://www.linkedin.com/in/sample-tanaka",
      name: "田中 一郎",
      companyName: companyC.name,
      companyId: companyC.id,
      title: "営業部長",
      industry: "広告代理店",
      location: "東京都",
      profileText: "中小企業向けのWeb広告運用代理店で営業を統括。クライアントからSNS運用の相談を受けることが増えている。",
      workHistory: "広告代理店一筋15年",
      recentPosts: "",
      notes: "複数の経営者クライアントを抱えている様子。",
      source: "イベント名刺交換",
      status: "CONNECTED",
      overallScore: 71,
      customerScore: 30,
      partnerScore: 85,
      priority: "B",
      isCustomerLead: false,
      isPartnerLead: true,
      nextActionDate: daysFromNow(1),
      createdAt: daysAgo(7),
    },
  });

  await prisma.activity.createMany({
    data: [
      { leadId: leadC.id, type: "STATUS_CHANGE", fromStatus: "CANDIDATE", toStatus: "REVIEWED", createdAt: daysAgo(6) },
      { leadId: leadC.id, type: "STATUS_CHANGE", fromStatus: "REVIEWED", toStatus: "APPROVED", createdAt: daysAgo(6) },
      { leadId: leadC.id, type: "STATUS_CHANGE", fromStatus: "APPROVED", toStatus: "REQUEST_SENT", createdAt: daysAgo(5) },
      { leadId: leadC.id, type: "STATUS_CHANGE", fromStatus: "REQUEST_SENT", toStatus: "CONNECTED", createdAt: daysAgo(2) },
    ],
  });

  await prisma.followUp.create({
    data: {
      leadId: leadC.id,
      dueDate: daysFromNow(1),
      memo: "初回DMの下書きを作成して送付する。",
      done: false,
      createdAt: daysAgo(2),
    },
  });

  // ---- 4. 採用責任者（顧客候補・審査済みのみ） ----
  const companyD = await prisma.company.create({
    data: { name: "株式会社グロースフィールド", industry: "人材・HR" },
  });

  const leadD = await prisma.lead.create({
    data: {
      linkedinUrl: "https://www.linkedin.com/in/sample-sato",
      name: "佐藤 次郎",
      companyName: companyD.name,
      companyId: companyD.id,
      title: "採用責任者",
      industry: "人材・HR",
      location: "福岡県",
      profileText: "急拡大中のスタートアップで採用を統括。エンジニア採用のためのSNS発信を模索中。",
      workHistory: "人材紹介会社 → スタートアップ採用責任者",
      recentPosts: "採用イベント登壇の投稿",
      notes: "",
      source: "LinkedIn検索",
      status: "REVIEWED",
      overallScore: 75,
      customerScore: 78,
      partnerScore: 35,
      priority: "A",
      isCustomerLead: true,
      isPartnerLead: false,
      nextActionDate: daysFromNow(5),
      createdAt: daysAgo(3),
    },
  });

  await prisma.profileAnalysis.create({
    data: {
      leadId: leadD.id,
      overallScore: 75,
      customerScore: 78,
      partnerScore: 35,
      priority: "A",
      reasons: JSON.stringify(["採用責任者としてエンジニア採用向けSNS発信に関心がある可能性があります"]),
      painPoints: JSON.stringify(["エンジニア採用のSNS発信ノウハウが不足している可能性があります"]),
      valueProps: JSON.stringify(["採用向けSNS支援による母集団形成の導線設計"]),
      talkingPoints: JSON.stringify(["採用イベント登壇の内容"]),
      cautions: null,
      missingInfo: JSON.stringify([]),
      suggestedInfo: JSON.stringify(["採用ポジションと目標人数"]),
      genericWarning: false,
      rawResponse: JSON.stringify({ seed: true }),
      modelUsed: "seed-mock",
      createdAt: daysAgo(3),
    },
  });

  await prisma.activity.create({
    data: { leadId: leadD.id, type: "STATUS_CHANGE", fromStatus: "CANDIDATE", toStatus: "REVIEWED", createdAt: daysAgo(3) },
  });

  // ---- 5. 情報不足のまま登録された候補（候補ステータスのまま） ----
  await prisma.lead.create({
    data: {
      linkedinUrl: "https://www.linkedin.com/in/sample-incomplete",
      name: "高橋 三郎",
      companyName: "株式会社不明商事",
      title: "",
      industry: "",
      location: "",
      profileText: "",
      workHistory: "",
      recentPosts: "",
      notes: "名刺交換のみ。詳細未確認。",
      source: "展示会",
      status: "CANDIDATE",
      createdAt: daysAgo(1),
    },
  });

  // ---- 6. 見送りになったケース ----
  const companyF = await prisma.company.create({
    data: { name: "個人事業（フリーランス）", industry: "その他" },
  });

  const leadF = await prisma.lead.create({
    data: {
      linkedinUrl: "https://www.linkedin.com/in/sample-passed",
      name: "伊藤 四郎",
      companyName: companyF.name,
      companyId: companyF.id,
      title: "フリーランスエンジニア",
      industry: "その他",
      location: "不明",
      profileText: "個人開発をメインに活動。法人向け事業は行っていない。",
      workHistory: "",
      recentPosts: "",
      notes: "SNS運用ニーズなし",
      source: "LinkedIn検索",
      status: "PASSED",
      overallScore: 22,
      customerScore: 15,
      partnerScore: 20,
      priority: "C",
      isCustomerLead: false,
      isPartnerLead: false,
      createdAt: daysAgo(12),
    },
  });

  await prisma.profileAnalysis.create({
    data: {
      leadId: leadF.id,
      overallScore: 22,
      customerScore: 15,
      partnerScore: 20,
      priority: "C",
      reasons: JSON.stringify(["法人向けSNS支援のニーズが薄い可能性があります"]),
      painPoints: JSON.stringify([]),
      valueProps: JSON.stringify([]),
      talkingPoints: JSON.stringify([]),
      cautions: "法人としての事業展開が確認できず、ENのサービスとの接点が薄いため見送りを推奨します。",
      missingInfo: JSON.stringify([]),
      suggestedInfo: JSON.stringify([]),
      genericWarning: false,
      rawResponse: JSON.stringify({ seed: true }),
      modelUsed: "seed-mock",
      createdAt: daysAgo(12),
    },
  });

  await prisma.activity.createMany({
    data: [
      { leadId: leadF.id, type: "STATUS_CHANGE", fromStatus: "CANDIDATE", toStatus: "REVIEWED", createdAt: daysAgo(12) },
      { leadId: leadF.id, type: "STATUS_CHANGE", fromStatus: "REVIEWED", toStatus: "PASSED", content: "法人事業なしのため見送り", createdAt: daysAgo(12) },
    ],
  });

  console.log("シードデータの投入が完了しました。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
