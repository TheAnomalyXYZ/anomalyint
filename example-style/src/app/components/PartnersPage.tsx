import { useNavigate } from 'react-router';

interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  color: string;
}

const partners: Partner[] = [
  {
    id: 'somnia',
    name: 'Somnia',
    logo: '🌊',
    description: 'High-performance blockchain for gaming',
    color: 'from-blue-500/20 to-purple-500/20',
  },
  {
    id: 'plume',
    name: 'Plume',
    logo: '🪶',
    description: 'Decentralized identity and credentials',
    color: 'from-purple-500/20 to-pink-500/20',
  },
];

export function PartnersPage() {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Partner Pages</h1>
        <p className="text-secondary">View blockchain partner dashboards and event data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {partners.map((partner) => (
          <button
            key={partner.id}
            onClick={() => navigate(`/partners/${partner.id}/dashboard`)}
            className="bg-card backdrop-blur-sm rounded-2xl p-6 border border-default hover:border-[#A192F8]/50 transition-all group cursor-pointer text-left"
          >
            <div className={`w-16 h-16 bg-gradient-to-br ${partner.color} rounded-2xl flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform`}>
              {partner.logo}
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2 group-hover:text-[#A192F8] transition-colors">
              {partner.name}
            </h3>
            <p className="text-secondary text-sm">{partner.description}</p>
            
            <div className="flex items-center gap-2 mt-4 text-[#A192F8] text-sm">
              <span>View Dashboard</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
