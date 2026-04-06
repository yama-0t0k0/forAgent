# DESIGN.md — Career Dev Tool Design System

> **Version**: 1.0.0
> **Last Updated**: 2026-04-06
> **Platform**: React Native (Expo) → Flutter (Future)
> **Source of Truth**: `shared/common_frontend/src/core/theme/theme.js`

---

## Overview

Career Dev Tool は「完全招待制」のエンジニアキャリア支援プラットフォームです。
専門性と信頼感を基調とした **ライトモード・モバイルファースト** のデザインシステムを採用し、
プロフェッショナルな空間としての安心感とクリーンな操作性を両立させます。

### Design Principles

1. **Professional Trust（専門的信頼感）** — ビジネスSNSとしての格調を保つ。派手な装飾よりも情報の明瞭性を優先。
2. **Mobile-First（モバイル最優先）** — 全UIはモバイル体験を起点に設計。PCは補助的位置づけ。
3. **Semantic Naming（意味的命名）** — ハードコードされた色値を排除し、用途に基づくトークン名で管理。
4. **Cross-Platform Portability（クロスプラットフォーム移植性）** — Phase 1（Expo/JS）→ Phase 2（Flutter/Dart）移行時にも本ドキュメントがSingle Source of Truthとして機能。
5. **Glassmorphism Accent（グラスモーフィズムアクセント）** — カード系UIに磨りガラス効果を限定的に適用し、洗練された奥行きを演出。

---

## Color Palette

### Semantic Color Tokens

すべてのUI要素は以下のセマンティックトークンを参照すること。
ハードコードされたカラーコード（例: `#007AFF`）の直接使用は **禁止** とする。

#### Background & Surface

| Token Name | Hex Value | Usage |
|---|---|---|
| `background` | `#F8FAFC` | アプリ全体の背景色（Slate-50） |
| `surface` | `#FFFFFF` | カード、モーダル、シートの背景 |
| `surface-elevated` | `rgba(255, 255, 255, 0.8)` | グラスモーフィズムカードの背景 |
| `surface-input` | `#F1F5F9` | テキスト入力フィールドの背景（Slate-100） |
| `surface-muted` | `#F5F5F5` | 無効化されたエリア、ロックコンテンツ背景 |

#### Text

| Token Name | Hex Value | Usage |
|---|---|---|
| `text-primary` | `#1E293B` | 本文テキスト、見出し（Slate-800） |
| `text-secondary` | `#64748B` | 補足テキスト、キャプション（Slate-500） |
| `text-muted` | `#999999` | プレースホルダー、無効テキスト |
| `text-inverse` | `#FFFFFF` | ボタン上、ダークバー上のテキスト |
| `text-link` | `#0EA5E9` | リンクテキスト（primary と同一） |

#### Brand & Action

| Token Name | Hex Value | Usage |
|---|---|---|
| `primary` | `#0EA5E9` | プライマリアクション、アクセントUI（Sky-500） |
| `primary-hover` | `#0284C7` | プライマリホバー/フォーカス状態（Sky-600） |
| `secondary` | `#8B5CF6` | セカンダリアクセント、差別化要素（Violet-500） |

#### Status / Feedback

| Token Name | Hex Value | Usage |
|---|---|---|
| `success` | `#10B981` | 成功状態、完了バッジ（Emerald-500） |
| `error` | `#EF4444` | エラー、バリデーション失敗（Red-500） |
| `warning` | `#F59E0B` | 警告、注意喚起（Amber-500） |
| `info` | `#0EA5E9` | 情報通知（primary と同一） |

#### Border & Divider

| Token Name | Hex Value | Usage |
|---|---|---|
| `border-default` | `#E2E8F0` | カード境界、区切り線（Slate-200） |
| `border-light` | `#F0F0F0` | 軽微な区切り（リスト項目間） |
| `border-glass` | `#E0F2FE` | グラスモーフィズムカードの境界線（Sky-100） |
| `border-focus` | `#0EA5E9` | フォーカスリング（primary と同一） |

---

## Typography

### Font Family

| Platform | Font Stack |
|---|---|
| iOS | `System` (SF Pro) |
| Android | `System` (Roboto) |
| Web | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| Code / Binary Pattern | iOS: `Avenir Next`, Android: `sans-serif`, Web: `ui-rounded` |

> **Note**: カスタムフォントは導入せず、各プラットフォームのシステムフォントを活用する。
> Web版のみ Google Fonts「Inter」を推奨。

### Type Scale

| Token | Font Size | Font Weight | Line Height | Usage |
|---|---|---|---|---|
| `heading-xl` | 32px | `bold` (700) | 40px | ヒーロータイトル |
| `heading-lg` | 28px | `900` | 34px | 大見出し（パーパスなど） |
| `heading-1` | 24px | `bold` (700) | — | セクションタイトル |
| `heading-2` | 20px | `bold` (700) | — | カードタイトル |
| `heading-3` | 18px | `600` | — | サブセクション、機能名 |
| `body` | 16px | `normal` (400) | — | 本文 |
| `body-small` | 14px | `normal` (400) | 20-22px | リスト項目、説明文 |
| `caption` | 14px | `normal` (400) | — | 補足情報。`text-secondary` カラーを使用 |
| `small` | 12px | `normal` (400) | — | バッジ、タイムスタンプ |
| `micro` | 10px | `800` | — | ラベル（GlassCardのラベル等） |
| `button` | 14px | `600`〜`bold` | — | ボタンテキスト |

---

## Spacing System

8px グリッドに基づく一貫したスペーシングシステムを使用する。

| Token | Value | Usage |
|---|---|---|
| `space-xs` | 4px | アイコンとテキスト間の微小ギャップ |
| `space-sm` | 8px | リスト項目内の要素間 |
| `space-md` | 16px | セクション内パディング、カード内余白 |
| `space-lg` | 24px | セクション間マージン |
| `space-xl` | 32px | ヒーローセクションのパディング |
| `space-xxl` | 48px | ページ最下部の余白 |

### Layout Constants

| Property | Value | Notes |
|---|---|---|
| Screen horizontal padding | 20px | `paddingHorizontal: 20` |
| Card padding | 16-20px | コンテキストに応じて調整 |
| Section margin bottom | 40px | セクション間の垂直方向余白 |
| Scroll content bottom padding | 40px | スクロール末端の余白 |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 4px | 小型バッジ、チップ |
| `radius-md` | 8px | ボタン（standard）、サムネイル |
| `radius-lg` | 12px | カード、モーダル、Feature Card |
| `radius-pill` | 20-22px | Pill型ボタン、タグ |
| `radius-full` | 9999px | アバター（完全円形） |

---

## Elevation & Depth

### Shadow System

重なり合う平面の関係を視覚的に示すために、2段階のシャドウシステムを使用する。

| Token | Properties | Usage |
|---|---|---|
| `shadow-sm` | `offset(0, 1)`, `opacity: 0.05`, `radius: 2`, `elevation: 2` | カード、リスト項目 |
| `shadow-md` | `offset(0, 2)`, `opacity: 0.1`, `radius: 4`, `elevation: 4` | モーダル、浮遊要素 |

### Glassmorphism

`GlassCard` コンポーネント等で使用するフロストガラス効果：

```
background: rgba(255, 255, 255, 0.8)   → surface-elevated
border: 1px solid #E0F2FE              → border-glass
shadow: shadow-sm
```

> グラスモーフィズムは **情報カード系（スキルバッジ、ステータス表示）に限定** して適用する。
> ナビゲーション要素やフォーム要素には適用しない。

---

## Components

### Buttons

#### PrimaryButton

| Property | Value |
|---|---|
| Background | `primary` (#0EA5E9) |
| Text Color | `text-inverse` (#FFFFFF) |
| Font | `button` (14px, bold) |
| Padding | 12px vertical, 20px horizontal |
| Border Radius | `radius-md` (8px) |
| Disabled Opacity | 0.6 |

**Variants:**
- `standard` — デフォルト。角丸 8px。
- `rounded` — Pill型。角丸 22px。ヘッダーボタン等に使用。
- `small` — コンパクト。5px vertical, 10px horizontal, 角丸 20px, fontSize 11px。

#### SecondaryButton

| Property | Value |
|---|---|
| Background | `transparent` |
| Border | 1px solid `border-default` |
| Text Color | `text-primary` |
| Interaction | テキストが `primary` に変化（ホバー/プレス） |

#### LinkButton（テキストリンク型）

| Property | Value |
|---|---|
| Text Color | `primary` (#0EA5E9) |
| Font Weight | 600 |
| Font Size | 16px |
| Background | transparent |

### Cards

#### Standard Card

```
background: surface (#FFFFFF)
border: 1px solid border-default (#E2E8F0)
border-radius: radius-lg (12px)
padding: 16-20px
shadow: shadow-sm
```

#### Feature Card

```
background: surface (#FFFFFF)
border: 1px solid #EEEEEE
border-radius: radius-lg (12px)
padding: 20px
margin-bottom: 16px
shadow: shadow-sm
```

#### GlassCard (Glassmorphism Badge)

```
background: surface-elevated (rgba(255, 255, 255, 0.8))
border: 1px solid border-glass (#E0F2FE)
border-radius: radius-lg (12px)
aspect-ratio: 1.1
shadow: shadow-sm
```

- ラベルテキスト: `micro` (10px, weight 800, `text-secondary`)
- スキル名テキスト: 11px, bold, `primary-hover` (#0284C7)

### Navigation

#### Screen Header

```
height: 56px
background: primary (#0EA5E9) or brand-specific (#1976D2)
text: text-inverse (#FFFFFF), heading-3 (18px, 700)
```

#### Bottom Navigation

- アクティブアイコン/テキスト: `primary`
- 非アクティブ: `text-secondary`
- 背景: `surface`
- 上部ボーダー: `border-light`

### Input Fields

| Property | Value |
|---|---|
| Background | `surface-input` (#F1F5F9) |
| Border | 1px solid `border-default` (フォーカス時 `border-focus`) |
| Border Radius | `radius-md` (8px) |
| Padding | 12px horizontal |
| Text | `body` (16px), `text-primary` |
| Placeholder | `text-muted` |

### Status Badge

| Status | Background | Text |
|---|---|---|
| Success / Active | `success` (10%) | `success` |
| Warning / Pending | `warning` (10%) | `warning` |
| Error / Rejected | `error` (10%) | `error` |
| Info / Default | `primary` (10%) | `primary` |

### List Items

```
flexDirection: row
padding: 12px
gap: 12px
border: 1px solid border-light (#EEEEEE)
border-radius: radius-lg (12px)
background: surface
```

- サムネイル: 64x64px, `radius-md` (8px)
- タイトル: `body-small` (14px, weight 700)
- ロック時: `surface-muted` 背景, テキスト `text-muted`

---

## Iconography

| Property | Value |
|---|---|
| Library | `@expo/vector-icons` (Ionicons) |
| Default Size | 24px (Navigation), 18px (Inline) |
| Color | Contextual — `primary`, `text-secondary`, `text-inverse` |

---

## Animation & Motion

| Property | Value | Usage |
|---|---|---|
| Button Press | `activeOpacity: 0.8` | TouchableOpacity のデフォルト |
| Hit Slop | `{ top: 8, bottom: 8, left: 8, right: 8 }` | 小型タップターゲットの拡張 |
| Screen Transition | React Navigation default | スタックナビゲーション |
| Loading | `ActivityIndicator` (size: small) | 非同期処理中の待機表示 |

> **禁止事項**: 過度なアニメーション、画面全体のフェードイン、不必要なバウンス効果。
> ビジネスツールとしての品位を保つ。

---

## Accessibility

| Requirement | Implementation |
|---|---|
| Touch Target | 最小 44x44px（hitSlop で調整可） |
| Contrast Ratio | WCAG AA 準拠（`text-primary` on `background` = 11.2:1） |
| `accessibilityRole` | すべてのインタラクティブ要素に設定（`button`, `link`, `header`） |
| `accessibilityLabel` | アイコンのみのボタンには必ず設定 |
| `testID` | E2Eテスト用に主要要素に付与 |

---

## Do's and Don'ts

### ✅ Do

- `THEME` オブジェクトからトークンを参照する（`THEME.primary`, `THEME.spacing.md`）
- セクション間は `space-lg`（24px）以上の余白を確保する
- カードには必ず `shadow-sm` を適用する
- ボタンには必ず `disabled` 状態と `loading` 状態を実装する
- モバイル画面幅（375px）を基準にレイアウトを設計する
- 日本語テキストの `lineHeight` は fontSize × 1.5 以上を確保する

### ❌ Don't

- ハードコードされた色値を StyleSheet 内で使用しない（`THEME` トークンを使う）
- `#007AFF`（iOS Blue）を直接使用しない — プロジェクト公式は `#0EA5E9`
- 3階層以上のネストされたカードを作らない
- グラスモーフィズムを情報カード以外に適用しない
- フォントサイズ 10px 未満のテキストを使用しない
- 1画面に 3 種類以上のアクションボタンカラーを配置しない

---

## File Reference

| File | Path | Role |
|---|---|---|
| Theme Tokens (Runtime) | `shared/common_frontend/src/core/theme/theme.js` | ランタイムで参照されるカラー・スペーシング定義 |
| PrimaryButton | `shared/common_frontend/src/core/components/PrimaryButton.js` | プライマリボタンコンポーネント |
| SecondaryButton | `shared/common_frontend/src/core/components/SecondaryButton.js` | セカンダリボタンコンポーネント |
| GlassCard | `shared/common_frontend/src/core/components/GlassCard.js` | グラスモーフィズムバッジ |
| AppShell | `shared/common_frontend/src/core/components/AppShell.js` | アプリ共通レイアウトシェル |
| ScreenHeader | `shared/common_frontend/src/core/components/ScreenHeader.js` | 画面ヘッダーコンポーネント |
| GenericBottomNav | `shared/common_frontend/src/core/components/GenericBottomNav.js` | 下部ナビゲーション |
| StatusBadge | `shared/common_frontend/src/core/components/StatusBadge.js` | ステータスバッジ |
| InputRow | `shared/common_frontend/src/core/components/InputRow.js` | 入力行コンポーネント |
| DetailModal | `shared/common_frontend/src/core/components/DetailModal.js` | 詳細モーダル |

---

## Agent Instructions

> **For AI Agents generating UI code in this project:**
>
> 1. **必ず本ファイルを読み込み**、以下に従うこと。
> 2. 色値は `THEME` オブジェクトから参照する（`import { THEME } from '@shared/src/core/theme/theme'`）。
> 3. 新しいカラーが必要な場合、まず本ドキュメントのセマンティックトークンに該当するものがないか確認する。
> 4. 存在しない場合は、`theme.js` にトークンを追加してから使用する。直接ハードコードしない。
> 5. コンポーネントは `shared/common_frontend/src/core/components/` に配置する。
> 6. 画面固有のスタイルは画面ファイル内の `StyleSheet.create` で定義してよいが、色値は `THEME` から参照する。
> 7. 日本語 UI テキストを含むため、lineHeight は適切に設定する。
