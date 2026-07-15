// /admin/banner — Home promo banner queue (Feature Batch v1.0 §2, Tier-A). IMAGE/GIF real upload,
// VIDEO = hosted Cloudflare Stream id/url + required poster. RBAC-gated by the /admin layout.
import { listBanners } from "../../../lib/admin/banner";
import { PageHeading } from "../../../components/admin/primitives";
import {
  CreateBannerForm,
  BannerList,
} from "../../../components/admin/banner-manager";
import { Card, CardTitle } from "../../../components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminBannerPage() {
  const banners = await listBanners();

  return (
    <section className="space-y-5">
      <PageHeading
        title="Home banner"
        subtitle="Scheduled queue shown on the learner Home hero slot — rotation order, active window, image/GIF or a hosted video."
      />

      <Card className="space-y-3">
        <CardTitle className="text-base">New banner</CardTitle>
        <CreateBannerForm />
      </Card>

      <Card className="space-y-3">
        <CardTitle className="text-base">Banners · {banners.length}</CardTitle>
        <BannerList banners={banners} />
      </Card>
    </section>
  );
}
