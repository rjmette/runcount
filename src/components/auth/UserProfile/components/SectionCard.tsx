import React from 'react';

export const SectionCard: React.FC<{
  heading: string;
  children: React.ReactNode;
}> = ({ heading, children }) => (
  <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
    <header className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{heading}</h3>
    </header>
    <div className="p-4">{children}</div>
  </section>
);
