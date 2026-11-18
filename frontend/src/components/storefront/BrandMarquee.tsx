import { Heart, Tag, Wallet } from 'lucide-react';

const messages = [
  { text: 'Find your next favourite', Icon: Heart },
  { text: 'Explore the offers', Icon: Tag },
  { text: 'Shop within your budget', Icon: Wallet },
];

export const BrandMarquee = () => <section className="brand-marquee" tabIndex={0} aria-label="Discover Pick2Buy">
  <p className="sr-only">{messages.map(({ text }) => text).join('. ')}.</p>
  <div className="brand-marquee__track" aria-hidden="true">
    {[0, 1].map(copy => <div className="brand-marquee__group" key={copy}>
      {messages.map(({ text, Icon }) => <span className="brand-marquee__item" key={text}><Icon className="brand-marquee__icon" size={20} strokeWidth={1.75} aria-hidden="true" />{text}</span>)}
    </div>)}
  </div>
</section>;
