import { buildFormDataWithFiles } from "@/utils/formData";
import { ACCEPTED_IMAGE_TYPES } from "@/utils/image";

import { useEffect, useState } from "react";

import { Link, useLoaderData, useNavigate, useParams } from "react-router";

import { toast } from "react-toastify";

import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { FileInput } from "#/components/ui/file-input";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { useSubmitForm } from "#/lib/router/use-submit-form";
import { useEditKitStore } from "#/lib/stores/editKit";
import { optimizeKitFiles } from "#/lib/utils/audio-optimization";
import { optimizeLogoImage } from "#/lib/utils/image-optimization";

import { action, loader } from "./about.server";

export { loader, action };

function EditAboutContent() {
  const { data, setAbout, setCategories, kitId, existingLogoUrl } = useEditKitStore();
  const { about, categories } = data;
  const loaderData = useLoaderData<typeof loader>();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    if (about.logo) {
      const url = URL.createObjectURL(about.logo);
      setLogoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setLogoUrl(existingLogoUrl || null);
    }
  }, [about.logo, existingLogoUrl]);

  const { submit, isSubmitting } = useSubmitForm({
    onSuccess: (result) => {
      toast.success("Kit updated successfully!");
      navigate(`/kit/play/${result.kitId}`);
    },
    onError: (errors) => {
      if (errors?.general) {
        toast.error(errors.general);
      }
    },
    resetAfterSubmit: false,
  });

  const handlePreview = () => {
    if (!about.name.trim()) {
      toast.error("Please enter a kit name before previewing");
      return;
    }
    navigate(`/kit/edit/${params.kitId}/preview`);
  };

  const handleSubmit = async () => {
    if (isOptimizing || isSubmitting) return;

    setIsOptimizing(true);
    const optimizedData = await optimizeKitFiles(data);
    const formData = buildFormDataWithFiles(optimizedData);
    setIsOptimizing(false);

    submit(formData, {
      method: "POST",
      action: `/kit/edit/${params.kitId}/about`,
      encType: "multipart/form-data",
    });
  };

  return (
    <div className="kit-about">
      <div className="kit-about__container">
        <div className="kit-about__header">
          <h1 className="kit-about__title">Edit Your Kit</h1>
          <p className="kit-about__subtitle">Update your drum kit details</p>
        </div>

        <div className="kit-about__form">
          <div className="kit-about__logo-section">
            <div className="kit-about__logo-preview">
              <img src={logoUrl || "/assets/default-kit-logo.png"} alt="Kit logo preview" />
            </div>
            <div className="kit-about__logo-upload">
              <h3 className="kit-about__logo-title">Kit Logo</h3>
              <p className="kit-about__logo-description">
                Upload a logo for your kit. It will be resized to 400x400px and should be in 1:1
                aspect ratio.
              </p>
              <FileInput
                variant="card"
                size="md"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                maxSize={5 * 1024 * 1024}
                key={about.logo?.name || "no-logo"}
                initialFile={about.logo || undefined}
                onFilesSelected={async (files) => {
                  if (files.length > 0) {
                    const optimizedLogo = await optimizeLogoImage(files[0]);
                    setAbout({
                      ...about,
                      logo: optimizedLogo,
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="kit-about__field">
            <Label htmlFor="kit-name" size="lg">
              Kit Name
            </Label>
            <Input
              id="kit-name"
              size="lg"
              placeholder="Enter your kit name..."
              value={about.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAbout({
                  ...about,
                  name: e.target.value,
                });
              }}
              className="kit-about__input"
            />
          </div>

          <div className="kit-about__field">
            <Label htmlFor="kit-description" size="lg">
              Description
            </Label>
            <Textarea
              id="kit-description"
              size="lg"
              style={{ resize: "none" }}
              placeholder="Describe your kit..."
              value={about.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setAbout({
                  ...about,
                  description: e.target.value,
                });
              }}
              rows={8}
              className="kit-about__textarea"
            />
          </div>

          <div className="kit-about__field">
            <Label htmlFor="kit-categories" size="lg">
              Categories
            </Label>
            <Select
              size="lg"
              contentVariant="popover"
              value={categories.map(String)}
              onValueChange={(values) => {
                const valuesArray = Array.isArray(values) ? values : [values];
                setCategories(valuesArray.map(Number));
              }}
              multiple={true}
            >
              <SelectTrigger className="kit-about__select">
                <SelectValue placeholder="Select categories..." />
              </SelectTrigger>
              <SelectContent className="kit-about__select-content">
                {loaderData.categories.map((category) => (
                  <SelectItem key={category.category_id} value={String(category.category_id)}>
                    {category.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="kit-about__field kit-about__field--checkbox">
            <Checkbox
              id="terms-accept"
              variant="card"
              size="lg"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <Label
              htmlFor="terms-accept"
              size="lg"
              modifiers={{
                noPaddingBottom: true,
              }}
            >
              I accept the{" "}
              <Link to="/legal/terms#4-user-content" className="kit-about__terms-link">
                User Content Terms
              </Link>
            </Label>
          </div>

          <div className="kit-about__actions">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePreview}
              disabled={!about.name.trim()}
            >
              Preview Kit
            </Button>
            <Button
              variant="primary"
              size="lg"
              state={isSubmitting || isOptimizing ? "loading" : "default"}
              disabled={isSubmitting || isOptimizing || !termsAccepted}
              onClick={handleSubmit}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function About() {
  return <EditAboutContent />;
}
