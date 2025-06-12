import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
