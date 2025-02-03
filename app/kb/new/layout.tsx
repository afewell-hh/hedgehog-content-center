import { Metadata } from 'next';

export const metadata: Metadata = {
  other: {
    'format-detection': 'telephone=no,date=no,address=no,email=no',
  },
};

export default function KbNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
