// Admin promo banner — Home hero slot (Feature Batch v1.0 §2). Server component: fetches the live
// (active + in-window) rotation queue and renders nothing when empty (honest — never a placeholder,
// D-29). Positioned low-priority (after Store, alongside Announcements) per this file's own
// established doctrine: real momentum outranks merchandising.
import { listLiveBanners } from "../../lib/admin/banner";
import { PromoBannerCarousel } from "./promo-banner-carousel";

export async function PromoBannerSlot() {
  const banners = await listLiveBanners();
  if (banners.length === 0) return null;
  return <PromoBannerCarousel banners={banners} />;
}
