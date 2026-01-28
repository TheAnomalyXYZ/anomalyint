import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

type CreateCampaignModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type WizardStep = 1 | 2 | 3 | 4 | 5;

type Phase = {
  id: string;
  name: string;
  price: string;
  currency: string;
  maxPerWallet: string;
  supply: string;
  startDate: string;
  endDate: string;
  requireAllowlist: boolean;
};

export function CreateCampaignModal({ isOpen, onClose }: CreateCampaignModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [phases, setPhases] = useState<Phase[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    game: '',
    chain: '',
    type: '',
    description: '',
    contractAddress: '',
    tokenStandard: 'ERC-721',
    totalSupply: '',
    metadataSource: '',
    acceptUSDC: true,
    acceptNative: true,
    acceptStars: false,
    sourceWallet: 'any',
    destinationWallet: 'choice',
    feeHandling: 'baked',
    platformFee: '2.5',
  });

  if (!isOpen) return null;

  const steps = [
    { number: 1, label: 'Basics' },
    { number: 2, label: 'NFT Details' },
    { number: 3, label: 'Phases' },
    { number: 4, label: 'Payment' },
    { number: 5, label: 'Review' },
  ];

  const addPhase = () => {
    const newPhase: Phase = {
      id: Date.now().toString(),
      name: '',
      price: '',
      currency: 'USDC',
      maxPerWallet: '',
      supply: '',
      startDate: '',
      endDate: '',
      requireAllowlist: false,
    };
    setPhases([...phases, newPhase]);
  };

  const removePhase = (id: string) => {
    setPhases(phases.filter((p) => p.id !== id));
  };

  const updatePhase = (id: string, field: keyof Phase, value: string | boolean) => {
    setPhases(
      phases.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-8 py-6 border-b border-[#334155] flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Create Campaign</h2>
              <p className="text-sm text-gray-400 mt-1">
                Set up a new NFT drop or token sale
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#334155] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-8 py-4 border-b border-[#334155] bg-[#0F172A]">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        currentStep === step.number
                          ? 'bg-[#3B82F6] text-white'
                          : currentStep > step.number
                          ? 'bg-green-600 text-white'
                          : 'bg-[#1E293B] border border-[#334155] text-gray-400'
                      }`}
                    >
                      {step.number}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        currentStep >= step.number ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-[2px] bg-[#334155] mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {/* Step 1: Basics */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Genesis Knights NFT Drop"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Game *
                    </label>
                    <select
                      value={formData.game}
                      onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3B82F6] cursor-pointer"
                    >
                      <option value="">Select game</option>
                      <option value="Dont Die">Dont Die</option>
                      <option value="GMeow">GMeow</option>
                      <option value="Goonville">Goonville</option>
                      <option value="MooFO">MooFO</option>
                      <option value="Vectra">Vectra</option>
                      <option value="Neura Knights">Neura Knights</option>
                      <option value="Synapse">Synapse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Chain *
                    </label>
                    <select
                      value={formData.chain}
                      onChange={(e) => setFormData({ ...formData, chain: e.target.value })}
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3B82F6] cursor-pointer"
                    >
                      <option value="">Select chain</option>
                      <option value="Avalanche">Avalanche</option>
                      <option value="Ethereum">Ethereum</option>
                      <option value="Solana">Solana</option>
                      <option value="Aptos">Aptos</option>
                      <option value="Somnia">Somnia</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Campaign Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3B82F6] cursor-pointer"
                  >
                    <option value="">Select type</option>
                    <option value="NFT Drop">NFT Drop</option>
                    <option value="Token Sale">Token Sale</option>
                    <option value="Free Mint">Free Mint</option>
                    <option value="Allowlist Mint">Allowlist Mint</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your campaign..."
                    rows={4}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Campaign Artwork
                  </label>
                  <div className="border-2 border-dashed border-[#334155] rounded-lg p-8 text-center hover:border-[#3B82F6] transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: NFT Details */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contract Address
                  </label>
                  <input
                    type="text"
                    value={formData.contractAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, contractAddress: e.target.value })
                    }
                    placeholder="0x... or leave blank to deploy new"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to deploy a new contract automatically
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Token Standard *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="ERC-721"
                        checked={formData.tokenStandard === 'ERC-721'}
                        onChange={(e) =>
                          setFormData({ ...formData, tokenStandard: e.target.value })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">ERC-721</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="ERC-1155"
                        checked={formData.tokenStandard === 'ERC-1155'}
                        onChange={(e) =>
                          setFormData({ ...formData, tokenStandard: e.target.value })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">ERC-1155</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Supply *
                  </label>
                  <input
                    type="number"
                    value={formData.totalSupply}
                    onChange={(e) =>
                      setFormData({ ...formData, totalSupply: e.target.value })
                    }
                    placeholder="100"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Metadata Source
                  </label>
                  <input
                    type="text"
                    value={formData.metadataSource}
                    onChange={(e) =>
                      setFormData({ ...formData, metadataSource: e.target.value })
                    }
                    placeholder="ipfs://... or upload JSON"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Phases */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    Define sale phases (e.g., Allowlist, Public)
                  </p>
                  <button
                    onClick={addPhase}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Phase
                  </button>
                </div>

                {phases.length === 0 && (
                  <div className="border-2 border-dashed border-[#334155] rounded-lg p-8 text-center">
                    <p className="text-gray-400">No phases added yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Click "Add Phase" to create your first sale phase
                    </p>
                  </div>
                )}

                {phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className="bg-[#0F172A] border border-[#334155] rounded-lg p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">Phase {index + 1}</h4>
                      <button
                        onClick={() => removePhase(phase.id)}
                        className="p-1 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Phase Name</label>
                        <input
                          type="text"
                          value={phase.name}
                          onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                          placeholder="e.g., Allowlist"
                          className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Price</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={phase.price}
                            onChange={(e) => updatePhase(phase.id, 'price', e.target.value)}
                            placeholder="70"
                            className="flex-1 bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
                          />
                          <select
                            value={phase.currency}
                            onChange={(e) =>
                              updatePhase(phase.id, 'currency', e.target.value)
                            }
                            className="bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6] cursor-pointer"
                          >
                            <option value="USDC">USDC</option>
                            <option value="ETH">ETH</option>
                            <option value="AVAX">AVAX</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Max Per Wallet
                        </label>
                        <input
                          type="number"
                          value={phase.maxPerWallet}
                          onChange={(e) =>
                            updatePhase(phase.id, 'maxPerWallet', e.target.value)
                          }
                          placeholder="5"
                          className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Supply</label>
                        <input
                          type="number"
                          value={phase.supply}
                          onChange={(e) => updatePhase(phase.id, 'supply', e.target.value)}
                          placeholder="50"
                          className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                        <input
                          type="datetime-local"
                          value={phase.startDate}
                          onChange={(e) =>
                            updatePhase(phase.id, 'startDate', e.target.value)
                          }
                          className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">End Date</label>
                        <input
                          type="datetime-local"
                          value={phase.endDate}
                          onChange={(e) => updatePhase(phase.id, 'endDate', e.target.value)}
                          className="w-full bg-[#1E293B] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={phase.requireAllowlist}
                        onChange={(e) =>
                          updatePhase(phase.id, 'requireAllowlist', e.target.checked)
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-sm text-white">Require allowlist</span>
                    </label>

                    {phase.requireAllowlist && (
                      <div className="pl-6">
                        <button className="text-sm text-[#3B82F6] hover:text-[#3B82F6]/80 cursor-pointer">
                          Upload CSV or select existing list
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Payment Settings */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Accepted Payment Methods
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.acceptUSDC}
                        onChange={(e) =>
                          setFormData({ ...formData, acceptUSDC: e.target.checked })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">USDC</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.acceptNative}
                        onChange={(e) =>
                          setFormData({ ...formData, acceptNative: e.target.checked })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">Native token (ETH, AVAX, etc.)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.acceptStars}
                        onChange={(e) =>
                          setFormData({ ...formData, acceptStars: e.target.checked })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">Telegram Stars</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Source Wallet Requirement
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="privy"
                        checked={formData.sourceWallet === 'privy'}
                        onChange={(e) =>
                          setFormData({ ...formData, sourceWallet: e.target.value })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">Privy wallet only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="any"
                        checked={formData.sourceWallet === 'any'}
                        onChange={(e) =>
                          setFormData({ ...formData, sourceWallet: e.target.value })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">Any connected wallet</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="choice"
                        checked={formData.sourceWallet === 'choice'}
                        onChange={(e) =>
                          setFormData({ ...formData, sourceWallet: e.target.value })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">User's choice</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Destination for Minted NFT
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="privy"
                        checked={formData.destinationWallet === 'privy'}
                        onChange={(e) =>
                          setFormData({ ...formData, destinationWallet: e.target.value })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">Always to Privy wallet</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="connected"
                        checked={formData.destinationWallet === 'connected'}
                        onChange={(e) =>
                          setFormData({ ...formData, destinationWallet: e.target.value })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">Always to connected wallet</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="choice"
                        checked={formData.destinationWallet === 'choice'}
                        onChange={(e) =>
                          setFormData({ ...formData, destinationWallet: e.target.value })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">User's choice at mint</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Fee Handling
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="baked"
                        checked={formData.feeHandling === 'baked'}
                        onChange={(e) =>
                          setFormData({ ...formData, feeHandling: e.target.value })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">
                        Bake gas into price (user sees flat price)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="separate"
                        checked={formData.feeHandling === 'separate'}
                        onChange={(e) =>
                          setFormData({ ...formData, feeHandling: e.target.value })
                        }
                        className="w-4 h-4 text-[#3B82F6]"
                      />
                      <span className="text-white">
                        Show gas separately (user sees price + fees)
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Platform Fee (%)
                  </label>
                  <input
                    type="number"
                    value={formData.platformFee}
                    onChange={(e) =>
                      setFormData({ ...formData, platformFee: e.target.value })
                    }
                    step="0.1"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-5">
                  <h3 className="font-semibold text-white mb-4">Campaign Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white ml-2">{formData.name || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Game:</span>
                      <span className="text-white ml-2">{formData.game || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Chain:</span>
                      <span className="text-white ml-2">{formData.chain || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white ml-2">{formData.type || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Token Standard:</span>
                      <span className="text-white ml-2">{formData.tokenStandard}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Supply:</span>
                      <span className="text-white ml-2">
                        {formData.totalSupply || 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Phases:</span>
                      <span className="text-white ml-2">{phases.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Platform Fee:</span>
                      <span className="text-white ml-2">{formData.platformFee}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-400">
                    ⓘ Review all settings carefully. You can save as draft to make changes
                    later.
                  </p>
                </div>

                {phases.length === 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-sm text-yellow-400">
                      ⚠️ Warning: No phases configured. Add at least one phase before
                      launching.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-[#334155] flex items-center justify-between bg-[#0F172A]">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Back
            </button>

            <div className="flex gap-3">
              {currentStep === 5 ? (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-[#1E293B] border border-[#334155] hover:bg-[#334155] text-white rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Launch Campaign
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
