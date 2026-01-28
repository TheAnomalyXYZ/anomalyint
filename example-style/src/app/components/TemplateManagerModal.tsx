import { X, Plus, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';

type Template = {
  id: string;
  name: string;
  content: string;
  lastUsed: string | null;
  createdBy: string;
};

type TemplateManagerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
};

export function TemplateManagerModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateManagerModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');

  // Mock templates
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Welcome Message',
      content:
        'Hey {username}! 👋\n\nWelcome to {game}. You\'re all set to start playing.\n\nNeed help? Check out our guide or ask in the community.',
      lastUsed: '2 days ago',
      createdBy: 'Roy Tanaka',
    },
    {
      id: '2',
      name: 'Event Announcement',
      content:
        '🎮 New Event Alert!\n\n{event_name} is now live in {game}.\n\nDon\'t miss out — ends {event_end_date}.',
      lastUsed: '1 week ago',
      createdBy: 'Roy Tanaka',
    },
    {
      id: '3',
      name: 'Reward Notification',
      content:
        '🎁 You\'ve earned a reward!\n\n{reward_amount} credits have been added to your account.\n\nKeep playing to earn more!',
      lastUsed: null,
      createdBy: 'Admin',
    },
  ]);

  if (!isOpen) return null;

  const handleCreateNew = () => {
    setIsEditing(true);
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateContent('');
  };

  const handleEdit = (template: Template) => {
    setIsEditing(true);
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateContent(template.content);
  };

  const handleSave = () => {
    if (editingTemplate) {
      // Update existing
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, name: templateName, content: templateContent }
            : t
        )
      );
    } else {
      // Create new
      const newTemplate: Template = {
        id: Date.now().toString(),
        name: templateName,
        content: templateContent,
        lastUsed: null,
        createdBy: 'Roy Tanaka',
      };
      setTemplates([...templates, newTemplate]);
    }
    setIsEditing(false);
    setEditingTemplate(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter((t) => t.id !== id));
    }
  };

  const handleUseTemplate = (template: Template) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-8 py-6 border-b border-[#334155] flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Message Templates</h2>
              <p className="text-sm text-gray-400 mt-1">
                Manage reusable message templates
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#334155] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {!isEditing ? (
              // Template List
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-gray-400">{templates.length} templates</p>
                  <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Create Template
                  </button>
                </div>

                {/* Templates Table */}
                <div className="bg-[#0F172A] border border-[#334155] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#1E293B]">
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">
                          Name
                        </th>
                        <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">
                          Last Used
                        </th>
                        <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">
                          Created By
                        </th>
                        <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]">
                      {templates.map((template) => (
                        <tr key={template.id} className="hover:bg-[#1E293B]/50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-white">
                              {template.name}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 truncate max-w-md">
                              {template.content}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {template.lastUsed || 'Never'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {template.createdBy}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUseTemplate(template)}
                                className="px-3 py-1 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                              >
                                Use
                              </button>
                              <button
                                onClick={() => handleEdit(template)}
                                className="p-2 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4 text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(template.id)}
                                className="p-2 hover:bg-[#334155] rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Template Editor
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Welcome Message"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message Content *
                  </label>
                  <textarea
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    placeholder="Write your message... Use {username}, {game}, {credits_balance} as variables"
                    rows={12}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#3B82F6] resize-none font-mono text-sm"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Available variables: {'{username}'}, {'{game}'}, {'{credits_balance}'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {templateContent.length} / 4096 characters
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-400">
                    ℹ️ Use **bold**, *italic*, and `code` for Telegram formatting
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={!templateName || !templateContent}
                    className="px-6 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Save Template
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 bg-[#0F172A] border border-[#334155] hover:bg-[#334155] text-white rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  {editingTemplate && (
                    <button
                      onClick={() => {
                        handleDelete(editingTemplate.id);
                        setIsEditing(false);
                      }}
                      className="px-6 py-2 bg-red-600/20 border border-red-600/30 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors cursor-pointer ml-auto"
                    >
                      Delete Template
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}