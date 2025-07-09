// LoadingButton component usage examples
import React, { useState } from 'react';
import { LoadingButton } from './playful-loading';

// Example usage component (for reference only)
export const LoadingButtonExamples: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-4 p-8">
      <h2 className="text-2xl font-bold mb-6">LoadingButton Examples</h2>
      
      {/* Primary Button - Default */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Primary Button (Default)</h3>
        <LoadingButton
          isLoading={isLoading}
          onClick={handleClick}
          loadingType="creating"
        >
          Simpan Data
        </LoadingButton>
      </div>

      {/* Secondary Button */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Secondary Button</h3>
        <LoadingButton
          isLoading={isLoading}
          onClick={handleClick}
          variant="secondary"
          loadingType="processing"
        >
          Batal
        </LoadingButton>
      </div>

      {/* Outline Button */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Outline Button</h3>
        <LoadingButton
          isLoading={isLoading}
          onClick={handleClick}
          variant="outline"
          loadingType="saving"
        >
          Edit
        </LoadingButton>
      </div>

      {/* Ghost Button */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Ghost Button</h3>
        <LoadingButton
          isLoading={isLoading}
          onClick={handleClick}
          variant="ghost"
          loadingType="deleting"
        >
          Hapus
        </LoadingButton>
      </div>

      {/* Different Sizes */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Different Sizes</h3>
        <div className="flex items-center space-x-4">
          <LoadingButton
            isLoading={isLoading}
            onClick={handleClick}
            size="sm"
          >
            Small
          </LoadingButton>
          <LoadingButton
            isLoading={isLoading}
            onClick={handleClick}
            size="md"
          >
            Medium
          </LoadingButton>
          <LoadingButton
            isLoading={isLoading}
            onClick={handleClick}
            size="lg"
          >
            Large
          </LoadingButton>
        </div>
      </div>

      {/* Submit Button in Form */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Submit Button in Form</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleClick(); }}>
          <LoadingButton
            isLoading={isLoading}
            type="submit"
            loadingType="creating"
          >
            Kirim Formulir
          </LoadingButton>
        </form>
      </div>

      {/* Disabled State */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Disabled State</h3>
        <LoadingButton
          isLoading={false}
          onClick={handleClick}
          disabled={true}
        >
          Button Disabled
        </LoadingButton>
      </div>

      {/* Custom className */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Custom Styling</h3>
        <LoadingButton
          isLoading={isLoading}
          onClick={handleClick}
          className="w-full"
          loadingType="processing"
        >
          Full Width Button
        </LoadingButton>
      </div>
    </div>
  );
};

// Common usage patterns:

// 1. Registration/Submit forms
export const RegistrationButtonExample = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <LoadingButton
      isLoading={isSubmitting}
      type="submit"
      loadingType="creating"
      className="w-full"
    >
      Daftar Sekarang
    </LoadingButton>
  );
};

// 2. Data saving operations
export const SaveButtonExample = () => {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <LoadingButton
      isLoading={isSaving}
      onClick={() => setIsSaving(true)}
      loadingType="saving"
    >
      Simpan Perubahan
    </LoadingButton>
  );
};

// 3. Delete operations
export const DeleteButtonExample = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <LoadingButton
      isLoading={isDeleting}
      onClick={() => setIsDeleting(true)}
      variant="outline"
      loadingType="deleting"
    >
      Hapus Item
    </LoadingButton>
  );
};

// 4. Email verification
export const EmailVerificationExample = () => {
  const [isVerifying, setIsVerifying] = useState(false);

  return (
    <LoadingButton
      isLoading={isVerifying}
      onClick={() => setIsVerifying(true)}
      loadingType="processing"
    >
      Verifikasi Email
    </LoadingButton>
  );
};