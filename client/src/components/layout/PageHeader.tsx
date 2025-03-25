import React from "react";
import { Breadcrumbs } from "./Breadcrumbs";

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <Breadcrumbs />
      <div className="mt-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-[#3e0075] to-[#5a0099] bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-gray-600 max-w-4xl">
            {description}
          </p>
        )}
      </div>
      <div className="h-1 w-20 bg-gradient-to-r from-[#3e0075] to-[#5a0099] rounded-full mt-4"></div>
    </div>
  );
}