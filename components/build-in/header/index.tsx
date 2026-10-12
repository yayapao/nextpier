import { siteConfig } from '@/lib/metadata';
import Logo from './logo';
import GithubButton from './github';
import { HeaderActions } from './actions';
import nextpier from '@/nextpier.config.json';

const Header = () => {
  return (
    <header className="app-toolbar sticky top-0 z-40 flex h-12 items-center justify-between border-b bg-background px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Logo />
        <span className="truncate text-sm font-semibold">
          {siteConfig.name}
        </span>
      </div>
      <div className="app-toolbar__interactive flex items-center gap-1">
        <GithubButton />
        <HeaderActions harnessEnabled={nextpier.features.harness} />
      </div>
    </header>
  );
};

export default Header;
