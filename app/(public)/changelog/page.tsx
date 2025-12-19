'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Sparkles, Rocket, Wrench, Shield, ArrowLeft, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  changelogData,
  getChangeTypeIcon,
  getChangeTypeColor,
  type ChangeType,
  type ChangelogEntry,
} from '@/lib/changelog/changelog-data'
import { cn } from '@/lib/utils'

const changeTypeFilters: { type: ChangeType | 'all'; label: string; icon: React.ReactNode }[] = [
  { type: 'all', label: 'All', icon: <Filter className="h-4 w-4" /> },
  { type: 'feature', label: 'Features', icon: <Sparkles className="h-4 w-4" /> },
  { type: 'improvement', label: 'Improvements', icon: <Rocket className="h-4 w-4" /> },
  { type: 'fix', label: 'Fixes', icon: <Wrench className="h-4 w-4" /> },
  { type: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
]

function VersionCard({ entry, defaultExpanded = false }: { entry: ChangelogEntry; defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <Card className={cn('transition-all duration-200', entry.major && 'border-primary/50 bg-primary/5')}>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={entry.major ? 'default' : 'secondary'} className="text-sm">
              v{entry.version}
            </Badge>
            <CardTitle className="text-lg">{entry.title}</CardTitle>
            {entry.major && (
              <Badge variant="outline" className="text-xs text-primary border-primary/50">
                Major Release
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{entry.date}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-2">{entry.description}</p>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 border-t pt-4">
            {entry.changes.map((change, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{getChangeTypeIcon(change.type)}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn('font-medium', getChangeTypeColor(change.type))}>
                      {change.title}
                    </span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {change.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{change.description}</p>
                </div>
              </div>
            ))}
          </div>
          {entry.internalBuild && (
            <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
              Internal Build: {entry.internalBuild}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default function ChangelogPage() {
  const [filter, setFilter] = useState<ChangeType | 'all'>('all')

  const filteredData = changelogData
    .map((entry) => ({
      ...entry,
      changes:
        filter === 'all'
          ? entry.changes
          : entry.changes.filter((change) => change.type === filter),
    }))
    .filter((entry) => entry.changes.length > 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Zazzles</span>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Changelog</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay up to date with the latest features, improvements, and fixes in Zazzles - your AI Food Photography Studio.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {changeTypeFilters.map((item) => (
            <Button
              key={item.type}
              variant={filter === item.type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(item.type)}
              className="gap-2"
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </div>

        {/* Changelog Entries */}
        <div className="max-w-3xl mx-auto space-y-4">
          {filteredData.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No entries match your filter.</p>
                <Button
                  variant="link"
                  onClick={() => setFilter('all')}
                  className="mt-2"
                >
                  Show all entries
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredData.map((entry, index) => (
              <VersionCard
                key={entry.version}
                entry={entry}
                defaultExpanded={index === 0}
              />
            ))
          )}
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-16 py-12 border-t">
          <h2 className="text-2xl font-bold mb-4">Ready to transform your food photos?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join thousands of F&B businesses using Zazzles to create stunning food photography with AI.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
