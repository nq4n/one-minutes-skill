import Link from 'next/link';
import { Clapperboard, Instagram } from 'lucide-react';
import { Button } from './ui/button';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Link href="/" className="flex items-center space-x-2">
            <Clapperboard className="h-6 w-6 text-primary" />
            <p className="font-headline text-lg font-bold">OneMinuteSkill</p>
          </Link>
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by you. The source code is available on GitHub.
          </p>
        </div>
        <div className="flex items-center gap-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} OneMinuteSkill, Inc. All rights reserved.</p>
          <Button variant="ghost" size="icon" asChild>
            <Link href="https://www.instagram.com/oneminute.skill?igsh=OHdvbzhxcGF1cnox" target="_blank" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </footer>
  );
}
