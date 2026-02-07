"use client";

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { getCategoriesWithTools } from '@/config/tools';
import ToolCard from '@/components/ToolCard';
import { FaSearch, FaTimes } from 'react-icons/fa';

export default function HomeToolsClient() {
    const [searchQuery, setSearchQuery] = useState('');
    const t = useTranslations('Index');
    const tHeader = useTranslations('Header');

    const categoriesWithTools = getCategoriesWithTools();

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categoriesWithTools;

        const query = searchQuery.toLowerCase().trim();
        return categoriesWithTools
            .map(cat => ({
                ...cat,
                tools: cat.tools.filter(tool => {
                    const name = t(`tools.${tool.labelKey}`).toLowerCase();
                    return name.includes(query);
                }),
            }))
            .filter(cat => cat.tools.length > 0);
    }, [searchQuery, categoriesWithTools, t]);

    const totalResults = filteredCategories.reduce((sum, cat) => sum + cat.tools.length, 0);

    return (
        <>
            {/* 검색바 */}
            <div className="search-container">
                <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder={t('searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => setSearchQuery('')}>
                            <FaTimes />
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <div className="search-results-count">
                        {t('searchResults', { count: totalResults })}
                    </div>
                )}
            </div>

            {/* 도구 그리드 */}
            <div className="tools-grid">
                {filteredCategories.length === 0 ? (
                    <div className="no-results">
                        <p>{t('noResults')}</p>
                    </div>
                ) : (
                    filteredCategories.map((category) => (
                        <section key={category.key} className="tool-category">
                            <h2 className="category-title">
                                {tHeader(`categories.${category.key}`)}
                            </h2>
                            <div className="category-tools">
                                {category.tools.map((tool) => {
                                    const ToolIcon = tool.icon;
                                    return (
                                        <ToolCard
                                            key={tool.href}
                                            href={tool.href}
                                            icon={<ToolIcon />}
                                            title={t(`tools.${tool.labelKey}`)}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </>
    );
}
