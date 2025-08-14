import { AiRole, Building } from '../types';
import eventBus from './eventBus';

const ROLE_KEY = 'ai_evaluator_user_role';

// Inspired by Manager AI Plan: "Refine userRoleService.ts to enforce hierarchical overrides (CEO > Manager > Employee) and scope actions by building."
// Helper map to determine which building an AI role belongs to
const roleToBuildingMap: Record<AiRole, Building> = {
    [AiRole.Manager]: Building.OVERSIGHT,
    [AiRole.QA]: Building.OVERSIGHT,
    [AiRole.MetaArchitect_Evaluator]: Building.OVERSIGHT,
    [AiRole.MetaArchitect_Predictor]: Building.OVERSIGHT,
    [AiRole.AI_CEO]: Building.OVERSIGHT,
    [AiRole.FailSafe]: Building.OVERSIGHT,
    [AiRole.CoreLogic]: Building.CORE_OPERATIONS,
    [AiRole.CodeSynthesizer]: Building.CORE_OPERATIONS,
    [AiRole.UIUX]: Building.DESIGN_EXPERIENCE,
    [AiRole.AudioSocial]: Building.DESIGN_EXPERIENCE,
    [AiRole.CreativeScout]: Building.CREATIVE_INNOVATION,
    [AiRole.CreativeCatalyst]: Building.CREATIVE_INNOVATION,
    [AiRole.CEO]: Building.OVERSIGHT, // User's CEO role
    [AiRole.User]: Building.OVERSIGHT, // User's general role
};

class UserRoleService {
  private currentUserRole: AiRole = AiRole.Manager;

  constructor() {
    this.loadRole();
  }

  private loadRole() {
    try {
      const storedRole = localStorage.getItem(ROLE_KEY) as AiRole | null;
      if (storedRole && (storedRole === AiRole.Manager || storedRole === AiRole.CEO)) {
        this.currentUserRole = storedRole;
      } else {
        this.currentUserRole = AiRole.Manager; // Default role
      }
    } catch (e) {
      console.error("Failed to load user role from localStorage, using default.", e);
      this.currentUserRole = AiRole.Manager;
    }
  }

  private saveRole() {
    try {
      localStorage.setItem(ROLE_KEY, this.currentUserRole);
    } catch (e) {
      console.error("Failed to save user role to localStorage.", e);
    }
  }

  public getCurrentUserRole(): AiRole {
    return this.currentUserRole;
  }

  public setCurrentUserRole(role: AiRole) {
    if (role === AiRole.Manager || role === AiRole.CEO) {
      this.currentUserRole = role;
      this.saveRole();
      eventBus.publish('userRoleChanged', role);
    }
  }

  // Inspired by Manager AI Plan: "In services/userRoleService.ts, add a method canEditPrompt(editorRole: AiRole, targetRole: AiRole): boolean."
  // Inspired by Manager AI Plan: "Implement logic: AI_CEO can edit all prompts. Manager can edit CoreLogic, UIUX, AudioSocial, and QA prompts. Other roles cannot edit prompts."
  public canEditPrompt(editorRole: AiRole, targetRole: AiRole): boolean {
    const nonEditableRoles: AiRole[] = [
        AiRole.User, 
        AiRole.CEO, 
        AiRole.FailSafe,
        AiRole.AI_CEO,
        AiRole.MetaArchitect_Predictor,
        AiRole.MetaArchitect_Evaluator,
        AiRole.CodeSynthesizer,
    ];
    // Certain system-critical prompts are never editable
    if (nonEditableRoles.includes(targetRole)) {
        return false;
    }

    // CEO (the human user's selected role) can edit all remaining AI agent prompts
    if (editorRole === AiRole.CEO) {
        return true;
    }

    // Manager (the human user's selected role) can edit specific team prompts
    if (editorRole === AiRole.Manager) {
        const targetBuilding = roleToBuildingMap[targetRole];
        return targetBuilding === Building.CORE_OPERATIONS || 
               targetBuilding === Building.DESIGN_EXPERIENCE ||
               targetBuilding === Building.CREATIVE_INNOVATION ||
               targetRole === AiRole.QA;
    }

    return false;
  }
}

const userRoleService = new UserRoleService();
export default userRoleService;
