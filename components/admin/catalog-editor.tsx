"use client";
// Catalog course editor (GPS-M4 §2.5). Edit course fields, publish (server enforces the content
// gate), add modules, and add/edit lessons with their video asset ids. Each save round-trips a
// server action (Zod + audit + $transaction); the router refreshes on success.
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateCourseAction,
  publishCourseAction,
  createModuleAction,
  upsertLessonAction,
} from "../../app/admin/catalog/actions";
import { Card } from "../ui/card";

interface Lesson {
  id: string;
  title: string;
  videoAssetId: string | null;
  durationSec: number;
  order: number;
  isFreePreview: boolean;
}
interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}
export interface CourseData {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  status: "DRAFT" | "PUBLISHED" | "COMING_SOON";
  order: number;
  modules: Module[];
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-line px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function CatalogCourseEditor({ course }: { course: CourseData }) {
  const router = useRouter();
  const [title, setTitle] = useState(course.title);
  const [summary, setSummary] = useState(course.summary ?? "");
  const [category, setCategory] = useState(course.category ?? "");
  const [order, setOrder] = useState(String(course.order));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveCourse() {
    setBusy(true);
    setMsg(null);
    const res = await updateCourseAction({
      courseId: course.id,
      title,
      summary,
      category,
      order: Number(order),
    });
    setBusy(false);
    setMsg(
      res.ok ? { ok: true, text: "Saved." } : { ok: false, text: res.error },
    );
    if (res.ok) router.refresh();
  }

  async function publish() {
    setBusy(true);
    setMsg(null);
    const res = await publishCourseAction(course.id);
    setBusy(false);
    setMsg(
      res.ok
        ? { ok: true, text: "Published." }
        : { ok: false, text: res.error },
    );
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Category">
            <input
              className={inputCls}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Summary">
          <textarea
            className={inputCls}
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Order">
            <input
              className={inputCls}
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </Field>
          <Field label="Slug (immutable)">
            <input
              className={`${inputCls} bg-charcoal/5 text-muted`}
              value={course.slug}
              disabled
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={saveCourse}
            disabled={busy}
            className="rounded-lg bg-charcoal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save course
          </button>
          {course.status !== "PUBLISHED" && (
            <button
              onClick={publish}
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:bg-brand/90 disabled:opacity-50"
            >
              Publish
            </button>
          )}
          {msg && (
            <span
              className={`text-sm ${msg.ok ? "text-brand-deep" : "text-danger"}`}
            >
              {msg.text}
            </span>
          )}
        </div>
      </Card>

      {course.modules.map((m) => (
        <ModuleBlock key={m.id} courseId={course.id} module={m} />
      ))}

      <AddModule courseId={course.id} nextOrder={course.modules.length} />
    </div>
  );
}

function ModuleBlock({
  courseId,
  module,
}: {
  courseId: string;
  module: Module;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-bold text-ink">
          {module.title}
        </h3>
        <span className="text-xs text-muted">module #{module.order}</span>
      </div>
      <div className="space-y-2">
        {module.lessons.map((l) => (
          <LessonForm
            key={l.id}
            courseId={courseId}
            moduleId={module.id}
            lesson={l}
          />
        ))}
      </div>
      <LessonForm
        courseId={courseId}
        moduleId={module.id}
        nextOrder={module.lessons.length}
      />
    </Card>
  );
}

function LessonForm({
  courseId,
  moduleId,
  lesson,
  nextOrder,
}: {
  courseId: string;
  moduleId: string;
  lesson?: Lesson;
  nextOrder?: number;
}) {
  const router = useRouter();
  const isNew = !lesson;
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [videoAssetId, setVideo] = useState(lesson?.videoAssetId ?? "");
  const [durationSec, setDuration] = useState(String(lesson?.durationSec ?? 0));
  const [order, setOrder] = useState(String(lesson?.order ?? nextOrder ?? 0));
  const [isFreePreview, setPreview] = useState(lesson?.isFreePreview ?? false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    const res = await upsertLessonAction({
      courseId,
      moduleId,
      lessonId: lesson?.id,
      title,
      videoAssetId,
      durationSec: Number(durationSec),
      order: Number(order),
      isFreePreview,
    });
    setBusy(false);
    if (res.ok) {
      if (isNew) {
        setTitle("");
        setVideo("");
        setDuration("0");
      }
      router.refresh();
    } else setErr(res.error);
  }

  return (
    <div className="rounded-lg border border-line p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_1fr_5rem_4rem_auto] md:items-end">
        <label className="text-xs">
          <span className="mb-1 block text-muted">
            {isNew ? "New lesson title" : "Title"}
          </span>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-muted">Video asset id</span>
          <input
            className={inputCls}
            value={videoAssetId}
            onChange={(e) => setVideo(e.target.value)}
            placeholder="Stream UID / preview URL"
          />
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-muted">Sec</span>
          <input
            className={inputCls}
            type="number"
            value={durationSec}
            onChange={(e) => setDuration(e.target.value)}
          />
        </label>
        <label className="text-xs">
          <span className="mb-1 block text-muted">Order</span>
          <input
            className={inputCls}
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
        </label>
        <button
          onClick={save}
          disabled={busy}
          className="h-9 rounded-lg bg-charcoal px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          {isNew ? "Add" : "Save"}
        </button>
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={isFreePreview}
          onChange={(e) => setPreview(e.target.checked)}
        />
        Free preview
      </label>
      {err && <p className="mt-1 text-xs text-danger">{err}</p>}
    </div>
  );
}

function AddModule({
  courseId,
  nextOrder,
}: {
  courseId: string;
  nextOrder: number;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setErr(null);
    const res = await createModuleAction({ courseId, title, order: nextOrder });
    setBusy(false);
    if (res.ok) {
      setTitle("");
      router.refresh();
    } else setErr(res.error);
  }

  return (
    <Card className="flex flex-wrap items-end gap-2">
      <label className="flex-1 text-sm">
        <span className="mb-1 block font-medium text-ink">Add module</span>
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Module title"
        />
      </label>
      <button
        onClick={add}
        disabled={busy || !title.trim()}
        className="h-10 rounded-lg bg-charcoal px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        Add
      </button>
      {err && <p className="w-full text-xs text-danger">{err}</p>}
    </Card>
  );
}
