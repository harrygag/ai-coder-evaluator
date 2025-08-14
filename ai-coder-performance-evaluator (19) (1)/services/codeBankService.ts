import { InspirationCodeBank, CodeSnippet, AiRole, Building } from '../types';
import eventBus from './eventBus';

const BANK_KEY = 'ai_code_bank';

class CodeBankService {
  private bank: InspirationCodeBank = {};

  constructor() {
    this.bank = this.loadBankFromStorage();
  }

  private loadBankFromStorage(): InspirationCodeBank {
    try {
      const stored = localStorage.getItem(BANK_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error("Failed to parse code bank from localStorage", e);
      return {};
    }
  }
  
  private saveBank() {
    try {
      localStorage.setItem(BANK_KEY, JSON.stringify(this.bank));
      eventBus.publish('codeBank:updated', this.bank);
    } catch (e) {
      console.error("Failed to save code bank to localStorage", e);
    }
  }

  public getBank(): InspirationCodeBank {
    return this.bank;
  }

  public addSnippet(snippetData: Omit<CodeSnippet, 'id' | 'timestamp' | 'referencedCount'>): CodeSnippet {
    const timestamp = Date.now();
    const snippetId = `snippet-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
    
    const newSnippet: CodeSnippet = {
        ...snippetData,
        id: snippetId,
        timestamp,
        referencedCount: 0,
    };

    this.bank[snippetId] = newSnippet;
    this.saveBank();
    return newSnippet;
  }

  public updateSnippet(id: string, updates: Partial<CodeSnippet>): CodeSnippet | undefined {
      if (!this.bank[id]) return undefined;
      this.bank[id] = { ...this.bank[id], ...updates, timestamp: Date.now() };
      this.saveBank();
      return this.bank[id];
  }

  public incrementReferenceCount(id: string) {
      if(this.bank[id]) {
          this.bank[id].referencedCount++;
          this.saveBank();
      }
  }

  public querySnippets(query: string, count: number = 3): CodeSnippet[] {
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      if (queryWords.length === 0) return [];
      
      const allSnippets = Object.values(this.bank).filter(s => s.validationStatus === 'valid' || s.validationStatus === 'approved');

      const scoredSnippets = allSnippets.map(snippet => {
          let score = 0;
          const content = snippet.content.toLowerCase();
          const tags = snippet.relevanceTags.join(' ').toLowerCase();

          for (const word of queryWords) {
              if (content.includes(word)) score++;
              if (tags.includes(word)) score += 2;
          }
          return { snippet, score };
      });

      return scoredSnippets
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(item => item.snippet);
  }

  public getAllSnippets(): CodeSnippet[] {
      return Object.values(this.bank).sort((a, b) => b.timestamp - a.timestamp);
  }
}

const codeBankService = new CodeBankService();
export default codeBankService;
