import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Create Supabase admin client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper function to get user role (checks multiple sources)
async function getUserRole(userId: string): Promise<string> {
  const userRole = await kv.get(`user_role:${userId}`);
  const userStatus = await kv.get(`user_status:${userId}`);
  const isApproved = await kv.get(`user_approved:${userId}`);
  
  // Priority: user_role > user_status.role > default 'membre'
  if (userRole) return userRole;
  if (isApproved === 'true') return 'admin';
  if (userStatus?.role) return userStatus.role;
  return 'membre';
}

// Helper function to check if user is admin
async function isUserAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

// Helper function to check if user has supervisor or admin access
async function hasModeratorAccess(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return ['admin', 'superviseur'].includes(role);
}

// Helper function to check if user account is active
async function isUserActive(userId: string): Promise<{ active: boolean; reason?: string }> {
  const userStatus = await kv.get(`user_status:${userId}`);
  const isApproved = await kv.get(`user_approved:${userId}`);
  
  // Legacy approved users (before user_status system)
  if (isApproved === 'true' && !userStatus) {
    return { active: true };
  }
  
  // No status found and not legacy approved
  if (!userStatus) {
    return { active: false, reason: "Votre compte n'a pas été validé. Veuillez contacter un administrateur." };
  }
  
  // Check status
  if (userStatus.status === 'rejected') {
    return { active: false, reason: "Votre compte a été désactivé. Veuillez contacter un administrateur." };
  }
  
  if (userStatus.status === 'pending') {
    return { active: false, reason: "Votre compte est en attente d'approbation." };
  }
  
  return { active: true };
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-3b9ea24b/health", (c) => {
  return c.json({ status: "ok" });
});

// Login endpoint
app.post("/make-server-3b9ea24b/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email et mot de passe requis" }, 400);
    }

    // Create a non-admin client for user authentication
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Authenticate with Supabase
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return c.json({ error: "Identifiants incorrects" }, 401);
    }

    if (!data.user) {
      return c.json({ error: "Utilisateur non trouvé" }, 401);
    }

    // Check if user account is active
    const activeCheck = await isUserActive(data.user.id);
    console.log('[Login] User ID:', data.user.id, 'Active check:', activeCheck);
    
    if (!activeCheck.active) {
      console.log('[Login] Account not active for user:', data.user.id, 'Reason:', activeCheck.reason);
      return c.json({ error: activeCheck.reason || "Votre compte n'est pas actif." }, 403);
    }

    // Get user data
    const userStatus = await kv.get(`user_status:${data.user.id}`);
    const role = await getUserRole(data.user.id);
    const isAdmin = role === 'admin';
    const requirePasswordChange = await kv.get(`require_password_change:${data.user.id}`);
    console.log('[Login] User:', data.user.id, 'requirePasswordChange:', requirePasswordChange, 'userStatus.mustChangePassword:', userStatus?.mustChangePassword);

    return c.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || 
              `${data.user.user_metadata?.firstName || ''} ${data.user.user_metadata?.lastName || ''}`.trim() || 
              data.user.email,
        isAdmin,
        role,
        mustChangePassword: requirePasswordChange === 'true' || userStatus?.mustChangePassword || false
      },
      access_token: data.session.access_token
    });
  } catch (error) {
    console.error('Login exception:', error);
    return c.json({ error: "Erreur serveur lors de la connexion" }, 500);
  }
});

// Signup endpoint
app.post("/make-server-3b9ea24b/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, mot de passe et nom requis" }, 400);
    }

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create user in Supabase
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        firstName,
        lastName,
        phone: '',
        address: ''
      }
    });

    if (error) {
      console.error('Signup error:', error);
      if (error.message.includes('already registered')) {
        return c.json({ error: "Un compte existe déjà avec cet email" }, 400);
      }
      return c.json({ error: error.message }, 400);
    }

    if (!data.user) {
      return c.json({ error: "Erreur lors de la création du compte" }, 500);
    }

    // Create user status with pending approval
    await kv.set(`user_status:${data.user.id}`, {
      userId: data.user.id,
      status: 'pending',
      email,
      name,
      role: 'membre',
      isAdmin: false,
      createdAt: new Date().toISOString()
    });

    return c.json({
      message: "Compte créé avec succès. En attente d'approbation par un administrateur."
    });
  } catch (error) {
    console.error('Signup exception:', error);
    return c.json({ error: "Erreur serveur lors de l'inscription" }, 500);
  }
});

// Get session endpoint
app.get("/make-server-3b9ea24b/session", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Session invalide" }, 401);
    }

    // Get user status
    const userStatus = await kv.get(`user_status:${user.id}`);
    const userRole = await kv.get(`user_role:${user.id}`);
    const isApproved = await kv.get(`user_approved:${user.id}`);
    const requirePasswordChange = await kv.get(`require_password_change:${user.id}`);
    console.log('[Session] User:', user.id, 'requirePasswordChange:', requirePasswordChange, 'userStatus.mustChangePassword:', userStatus?.mustChangePassword);

    // Determine role
    let role: 'membre' | 'superviseur' | 'admin' = 'membre';
    let isAdmin = false;
    
    if (userRole === 'admin' || isApproved === 'true') {
      role = 'admin';
      isAdmin = true;
    } else if (userStatus?.role) {
      role = userStatus.role;
      isAdmin = userStatus.role === 'admin';
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || 
              `${user.user_metadata?.firstName || ''} ${user.user_metadata?.lastName || ''}`.trim() || 
              user.email,
        isAdmin,
        role,
        mustChangePassword: requirePasswordChange === 'true' || userStatus?.mustChangePassword || false
      },
      userStatus: userStatus || { status: 'pending' }
    });
  } catch (error) {
    console.error('Session exception:', error);
    return c.json({ error: "Erreur serveur lors de la vérification de session" }, 500);
  }
});

// Route pour configurer le super admin (theo.loyer@sdis50.fr)
app.post('/make-server-3b9ea24b/setup-super-admin', async (c) => {
  try {
    const SUPER_ADMIN_EMAIL = 'theo.loyer@sdis50.fr';
    
    // Récupérer l'utilisateur par email
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error listing users:', getUserError);
      return c.json({ error: 'Erreur lors de la récupération des utilisateurs' }, 500);
    }

    const user = users.users.find(u => u.email === SUPER_ADMIN_EMAIL);
    
    if (!user) {
      return c.json({ 
        error: `Le compte ${SUPER_ADMIN_EMAIL} n'existe pas. Veuillez d'abord créer ce compte.` 
      }, 404);
    }

    // Configurer les droits super admin
    await kv.set(`user_role:${user.id}`, 'admin');
    await kv.set(`user_approved:${user.id}`, 'true');
    
    // Also update user_status to approved with admin role
    const existingStatus = await kv.get(`user_status:${user.id}`) || {};
    await kv.set(`user_status:${user.id}`, {
      ...existingStatus,
      userId: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
      status: 'approved',
      role: 'admin',
      isAdmin: true,
      createdAt: existingStatus.createdAt || new Date().toISOString(),
      approvedAt: new Date().toISOString()
    });

    return c.json({ 
      message: `Le compte ${SUPER_ADMIN_EMAIL} a été configuré comme super admin avec succès !`,
      userId: user.id
    });
  } catch (error) {
    console.error('Error in setup-super-admin:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// Route pour créer le compte admin par défaut
app.post('/make-server-3b9ea24b/create-default-admin', async (c) => {
  try {
    const ADMIN_EMAIL = 'admin@tourlaville-pompiers.fr';
    const ADMIN_PASSWORD = 'admin50';
    
    // Vérifier si le compte existe déjà
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error listing users:', getUserError);
      return c.json({ error: 'Erreur lors de la récupération des utilisateurs' }, 500);
    }

    const existingUser = users.users.find(u => u.email === ADMIN_EMAIL);
    
    if (existingUser) {
      // L'utilisateur existe déjà, juste mettre à jour les droits
      await kv.set(`user_role:${existingUser.id}`, 'admin');
      await kv.set(`user_approved:${existingUser.id}`, 'true');
      
      return c.json({ 
        message: `Le compte admin existe déjà et a été configuré avec tous les droits !`,
        email: ADMIN_EMAIL,
        userId: existingUser.id
      });
    }

    // Créer le nouveau compte admin
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: 'Admin Tourlaville',
        firstName: 'Admin',
        lastName: 'Tourlaville',
        phone: '',
        address: ''
      }
    });

    if (createError || !newUser.user) {
      console.error('Error creating admin user:', createError);
      return c.json({ error: 'Erreur lors de la création du compte admin' }, 500);
    }

    // Configurer les droits admin
    await kv.set(`user_role:${newUser.user.id}`, 'admin');
    await kv.set(`user_approved:${newUser.user.id}`, 'true');

    return c.json({ 
      message: `Compte admin créé avec succès !`,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      userId: newUser.user.id,
      instructions: 'Vous pouvez maintenant vous connecter avec ces identifiants.'
    });
  } catch (error) {
    console.error('Error in create-default-admin:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

const SAINTE_BARBE_MAX_GUESTS = 2;

// Routes pour les inscriptions Sainte-Barbe
app.post("/make-server-3b9ea24b/events/sainte-barbe/register", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { numberOfGuests, tableNumber } = await c.req.json();

    if (!numberOfGuests || numberOfGuests < 1 || !tableNumber) {
      return c.json({ error: "Valid number of guests and table number required" }, 400);
    }

    if (numberOfGuests > SAINTE_BARBE_MAX_GUESTS) {
      return c.json({ error: `Maximum ${SAINTE_BARBE_MAX_GUESTS} personnes par inscription` }, 400);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is approved
    const userStatus = await kv.get(`user_status:${user.id}`);
    if (!userStatus || userStatus.status !== 'approved') {
      return c.json({ error: "User must be approved" }, 403);
    }

    // Check if user already has a registration and remove it
    const existingRegistration = await kv.get(`registration_sainte_barbe:${user.id}`);
    if (existingRegistration) {
      // Remove user from old table
      const oldTableKey = `table_sainte_barbe_${existingRegistration.tableNumber}`;
      const oldTableData = await kv.get(oldTableKey);
      
      if (oldTableData) {
        // Remove the user from participants
        oldTableData.participants = oldTableData.participants.filter(
          (p: any) => p.userId !== user.id
        );
        // Recalculate total seats
        oldTableData.totalSeats = oldTableData.participants.reduce(
          (sum: number, p: any) => sum + p.numberOfGuests, 
          0
        );
        await kv.set(oldTableKey, oldTableData);
      }
    }

    // Get current table data
    const tableKey = `table_sainte_barbe_${tableNumber}`;
    const tableData = await kv.get(tableKey) || { 
      tableNumber, 
      participants: [], 
      totalSeats: 0 
    };

    // Check if table has space
    if (tableData.totalSeats + numberOfGuests > 10) {
      return c.json({ error: "La table est déjà complète" }, 400);
    }

    // Add user to table
    tableData.participants.push({
      userId: user.id,
      name: user.user_metadata?.name || user.email,
      numberOfGuests
    });
    tableData.totalSeats += numberOfGuests;

    await kv.set(tableKey, tableData);

    // Save user registration
    await kv.set(`registration_sainte_barbe:${user.id}`, {
      userId: user.id,
      email: user.email,
      name: user.user_metadata?.name,
      numberOfGuests,
      tableNumber,
      registeredAt: new Date().toISOString()
    });

    return c.json({ 
      message: 'Registration successful',
      numberOfGuests,
      tableNumber
    });
  } catch (error) {
    console.error('Error registering for Sainte-Barbe:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get Sainte-Barbe tables
app.get("/make-server-3b9ea24b/events/sainte-barbe/tables", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get the configured number of tables (default 10)
    const numberOfTables = await kv.get('sainte_barbe_number_of_tables') || 10;
    console.log('[Sainte-Barbe Tables] Number of tables configured:', numberOfTables);

    // Initialize tables based on configured number
    const tables = [];
    for (let i = 1; i <= numberOfTables; i++) {
      const tableKey = `table_sainte_barbe_${i}`;
      const tableData = await kv.get(tableKey);
      
      if (!tableData) {
        // Initialize empty table
        const emptyTable = {
          tableNumber: i,
          participants: [],
          totalSeats: 0
        };
        await kv.set(tableKey, emptyTable);
        tables.push(emptyTable);
      } else {
        tables.push(tableData);
      }
    }

    return c.json({ tables });
  } catch (error) {
    console.error('Error getting Sainte-Barbe tables:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get my Sainte-Barbe registration
app.get("/make-server-3b9ea24b/events/sainte-barbe/my-registration", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get user's registration
    const registration = await kv.get(`registration_sainte_barbe:${user.id}`);
    
    if (!registration) {
      return c.json({ registered: false });
    }

    // Get the table data
    const tableData = await kv.get(`table_sainte_barbe_${registration.tableNumber}`);

    return c.json({ 
      registered: true,
      registration,
      table: tableData
    });
  } catch (error) {
    console.error('Error getting my registration:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Add participant manually to a Sainte-Barbe table
app.post("/make-server-3b9ea24b/admin/events/sainte-barbe/add-participant", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: "Admin access required" }, 403);
    }

    const { tableNumber, participantName, numberOfGuests } = await c.req.json();

    if (!tableNumber || !participantName || !numberOfGuests) {
      return c.json({ error: "All fields are required" }, 400);
    }

    if (numberOfGuests > SAINTE_BARBE_MAX_GUESTS) {
      return c.json({ error: `Maximum ${SAINTE_BARBE_MAX_GUESTS} personnes par ajout manuel` }, 400);
    }

    // Get table data
    const tableKey = `table_sainte_barbe_${tableNumber}`;
    const tableData = await kv.get(tableKey) || {
      tableNumber,
      participants: [],
      totalSeats: 0
    };

    // Check if there's enough space
    if (tableData.totalSeats + numberOfGuests > 10) {
      return c.json({ error: "La table est déjà complète" }, 400);
    }

    // Add participant to table
    tableData.participants.push({
      userId: `manual_${Date.now()}`,
      name: participantName,
      numberOfGuests,
      addedManually: true,
      addedBy: user.id,
      addedAt: new Date().toISOString()
    });
    tableData.totalSeats += numberOfGuests;

    await kv.set(tableKey, tableData);

    console.log('[Admin] Participant added manually:', participantName, 'to table:', tableNumber, 'by admin:', user.id);
    return c.json({ 
      message: 'Participant added successfully',
      tableData
    });
  } catch (error) {
    console.error('Error adding participant (admin):', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Remove participant from a Sainte-Barbe table
app.post("/make-server-3b9ea24b/admin/events/sainte-barbe/remove-participant", async (c) => {
  // (unchanged removal handler follows)
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: "Admin access required" }, 403);
    }

    const { tableNumber, participantUserId } = await c.req.json();

    if (!tableNumber || !participantUserId) {
      return c.json({ error: "Table number and participant ID are required" }, 400);
    }

    // Get table data
    const tableKey = `table_sainte_barbe_${tableNumber}`;
    const tableData = await kv.get(tableKey);

    if (!tableData) {
      return c.json({ error: "Table not found" }, 404);
    }

    // Find the participant
    const participantIndex = tableData.participants.findIndex(
      (p: any) => p.userId === participantUserId
    );

    if (participantIndex === -1) {
      return c.json({ error: "Participant not found" }, 404);
    }

    const participant = tableData.participants[participantIndex];
    
    // Remove participant from table
    tableData.participants.splice(participantIndex, 1);
    tableData.totalSeats -= participant.numberOfGuests;

    await kv.set(tableKey, tableData);

    // If it wasn't a manually added participant, also remove their registration
    if (!participantUserId.startsWith('manual_')) {
      await kv.del(`registration_sainte_barbe:${participantUserId}`);
    }

    console.log('[Admin] Participant removed:', participant.name, 'from table:', tableNumber, 'by admin:', user.id);
    return c.json({ 
      message: 'Participant removed successfully',
      tableData
    });
  } catch (error) {
    console.error('Error removing participant (admin):', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Normalize Sainte-Barbe registrations to enforce max guests
app.post("/make-server-3b9ea24b/admin/events/sainte-barbe/normalize-registrations", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) return c.json({ error: "No access token provided" }, 401);

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) return c.json({ error: "Admin access required" }, 403);

    const changes: any[] = [];

    for (let i = 1; i <= 15; i++) {
      const tableKey = `table_sainte_barbe_${i}`;
      const tableData = await kv.get(tableKey);
      if (!tableData) continue;

      let modified = false;
      for (const participant of tableData.participants) {
        if (participant.numberOfGuests > SAINTE_BARBE_MAX_GUESTS) {
          const old = participant.numberOfGuests;
          participant.numberOfGuests = SAINTE_BARBE_MAX_GUESTS;
          changes.push({ table: i, userId: participant.userId, old, new: participant.numberOfGuests });
          modified = true;

          // Update registration if applicable
          if (!participant.userId.startsWith('manual_')) {
            const regKey = `registration_sainte_barbe:${participant.userId}`;
            const reg = await kv.get(regKey);
            if (reg) {
              reg.numberOfGuests = participant.numberOfGuests;
              await kv.set(regKey, reg);
            }
          }
        }
      }

      if (modified) {
        // Recalculate totalSeats
        tableData.totalSeats = tableData.participants.reduce((sum: number, p: any) => sum + p.numberOfGuests, 0);
        await kv.set(tableKey, tableData);
      }
    }

    return c.json({ message: 'Normalization complete', changes });
  } catch (error) {
    console.error('Error normalizing registrations:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Event registration: Noel
app.post("/make-server-3b9ea24b/events/noel/register", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { numberOfAdults, numberOfChildren, comments } = await c.req.json();

    if (!numberOfAdults || numberOfAdults < 1) {
      return c.json({ error: "Valid number of adults required" }, 400);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is approved
    const userStatus = await kv.get(`user_status:${user.id}`);
    if (!userStatus || userStatus.status !== 'approved') {
      return c.json({ error: "User must be approved" }, 403);
    }

    // Save registration (overwrites existing registration if any)
    await kv.set(`registration_noel:${user.id}`, {
      userId: user.id,
      email: user.email,
      name: user.user_metadata?.name,
      numberOfAdults,
      numberOfChildren: numberOfChildren || 0,
      comments: comments || '',
      registeredAt: new Date().toISOString()
    });

    return c.json({ 
      message: 'Registration successful',
      numberOfAdults,
      numberOfChildren
    });
  } catch (error) {
    console.error('Error registering for Noel:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get my Noël registration
app.get("/make-server-3b9ea24b/events/noel/my-registration", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get user's registration
    const registration = await kv.get(`registration_noel:${user.id}`);
    
    if (!registration) {
      return c.json({ registered: false });
    }

    return c.json({ 
      registered: true,
      registration
    });
  } catch (error) {
    console.error('Error getting my Noel registration:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get Noel registrations (for organizers and admins)
app.get("/make-server-3b9ea24b/events/noel/registrations", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is organizer or admin
    const userStatus = await kv.get(`user_status:${user.id}`);
    if (!userStatus || !['superviseur', 'admin'].includes(userStatus.role || '')) {
      return c.json({ error: "Supervisor or Admin access required" }, 403);
    }

    // Get all Noel registrations (now returns {key, value})
    const allRegistrationsData = await kv.getByPrefix('registration_noel:');
    const registrations = allRegistrationsData.map(item => item.value);
    
    // Calculate totals
    const totalAdults = registrations.reduce((sum, r) => sum + (r.numberOfAdults || 0), 0);
    const totalChildren = registrations.reduce((sum, r) => sum + (r.numberOfChildren || 0), 0);

    return c.json({ 
      registrations,
      stats: {
        totalRegistrations: registrations.length,
        totalAdults,
        totalChildren,
        totalParticipants: totalAdults + totalChildren
      }
    });
  } catch (error) {
    console.error('Error getting Noel registrations:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// First admin setup endpoint with secret code
app.post("/make-server-3b9ea24b/admin/first-setup", async (c) => {
  try {
    const { email, password, secretCode } = await c.req.json();

    if (!email || !password || !secretCode) {
      return c.json({ error: "Email, password, and secret code are required" }, 400);
    }

    // Check secret code (you can change this code)
    const ADMIN_SECRET_CODE = Deno.env.get('ADMIN_SECRET_CODE') || 'POMPIERS2025';
    
    if (secretCode !== ADMIN_SECRET_CODE) {
      return c.json({ error: "Code secret incorrect" }, 403);
    }

    // Sign in the user to verify credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error during login in first-setup:', error);
      return c.json({ error: "Identifiants incorrects" }, 401);
    }

    // Update or create user status as approved admin
    await kv.set(`user_status:${data.user.id}`, {
      userId: data.user.id,
      status: 'approved',
      email: email,
      name: data.user.user_metadata?.name || email,
      isAdmin: true,
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    });

    return c.json({
      message: 'Vous êtes maintenant administrateur',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        isAdmin: true
      },
      access_token: data.session.access_token
    });
  } catch (error) {
    console.error('Unexpected error during first-setup:', error);
    return c.json({ error: 'Internal server error during setup' }, 500);
  }
});

// Reset password endpoint
app.post("/make-server-3b9ea24b/reset-password", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${c.req.header('Origin') || 'http://localhost:5173'}/reset-password`,
    });

    if (error) {
      console.error('Error sending reset password email:', error);
      // Don't reveal if email exists or not for security reasons
      return c.json({ 
        message: 'Si un compte existe avec cette adresse email, un lien de réinitialisation a été envoyé.' 
      });
    }

    return c.json({ 
      message: 'Un email de réinitialisation du mot de passe a été envoyé à votre adresse.' 
    });
  } catch (error) {
    console.error('Unexpected error during password reset:', error);
    return c.json({ error: 'Internal server error during password reset' }, 500);
  }
});

// Admin: Reset user password
app.post("/make-server-3b9ea24b/admin/reset-user-password", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { userId, newPassword, requirePasswordChange } = await c.req.json();

    if (!userId || !newPassword) {
      return c.json({ error: "userId and newPassword are required" }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }

    // Verify the requesting user is admin
    const { data: { user: adminUser }, error: adminError } = await supabase.auth.getUser(accessToken);

    if (adminError || !adminUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const adminStatus = await kv.get(`user_status:${adminUser.id}`);
    if (!adminStatus?.isAdmin && adminStatus?.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating user password:', updateError);
      return c.json({ error: updateError.message }, 400);
    }

    // If requirePasswordChange is true, set a flag in the user status
    if (requirePasswordChange) {
      const currentStatus = await kv.get(`user_status:${userId}`);
      await kv.set(`user_status:${userId}`, {
        ...currentStatus,
        mustChangePassword: true,
        passwordChangedAt: new Date().toISOString(),
        passwordChangedBy: adminUser.id
      });
      await kv.set(`require_password_change:${userId}`, 'true');
    } else {
      // Clear the flag if it was previously set
      const currentStatus = await kv.get(`user_status:${userId}`);
      await kv.set(`user_status:${userId}`, {
        ...currentStatus,
        mustChangePassword: false,
        passwordChangedAt: new Date().toISOString(),
        passwordChangedBy: adminUser.id
      });
      await kv.del(`require_password_change:${userId}`);
    }

    return c.json({ 
      message: 'Password updated successfully',
      requirePasswordChange 
    });
  } catch (error) {
    console.error('Unexpected error during admin password reset:', error);
    return c.json({ error: 'Internal server error during password reset' }, 500);
  }
});

// User: Change own password
app.post("/make-server-3b9ea24b/change-password", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { newPassword } = await c.req.json();

    if (!newPassword) {
      return c.json({ error: "newPassword is required" }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return c.json({ error: updateError.message }, 400);
    }

    // Clear the mustChangePassword flag
    const currentStatus = await kv.get(`user_status:${user.id}`);
    await kv.set(`user_status:${user.id}`, {
      ...currentStatus,
      mustChangePassword: false,
      passwordChangedAt: new Date().toISOString()
    });

    // Clear the require_password_change flag
    await kv.del(`require_password_change:${user.id}`);

    return c.json({ 
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Unexpected error during password change:', error);
    return c.json({ error: 'Internal server error during password change' }, 500);
  }
});

// Children Management Endpoints

// Helper function to calculate age from birth date
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Add a child
app.post("/make-server-3b9ea24b/children", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is approved
    const userStatus = await kv.get(`user_status:${user.id}`);
    if (userStatus?.status !== 'approved') {
      return c.json({ error: "Account not approved" }, 403);
    }

    const body = await c.req.json();
    const { nom, prenom, dateNaissance, parentUserId } = body;

    if (!nom || !prenom || !dateNaissance) {
      return c.json({ error: "Nom, prénom et date de naissance sont requis" }, 400);
    }

    // Validate date format
    const birthDate = new Date(dateNaissance);
    if (isNaN(birthDate.getTime())) {
      return c.json({ error: "Format de date invalide" }, 400);
    }

    // Get parent info if provided
    let parentName = undefined;
    if (parentUserId) {
      const { data: parentUser } = await supabase.auth.admin.getUserById(parentUserId);
      if (parentUser?.user) {
        parentName = parentUser.user.user_metadata?.name || parentUser.user.email;
      }
    }

    // Generate a unique ID for the child
    const childId = crypto.randomUUID();
    
    const childData = {
      id: childId,
      userId: user.id,
      userName: user.user_metadata?.name || user.email,
      userEmail: user.email,
      nom: nom.trim(),
      prenom: prenom.trim(),
      dateNaissance: dateNaissance,
      age: calculateAge(dateNaissance),
      parentUserId: parentUserId || undefined,
      parentName: parentName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store child data
    await kv.set(`children:${user.id}:${childId}`, childData);

    console.log('Child added successfully:', childData);
    return c.json({ 
      message: 'Enfant ajouté avec succès',
      child: childData 
    });
  } catch (error) {
    console.error('Error adding child:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get my children
app.get("/make-server-3b9ea24b/children", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get all children for this user (now returns {key, value})
    const childrenData = await kv.getByPrefix(`children:${user.id}:`);
    const children = childrenData.map(item => item.value);
    
    return c.json({ 
      children: children || []
    });
  } catch (error) {
    console.error('Error fetching children:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update a child
app.put("/make-server-3b9ea24b/children/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const childId = c.req.param('id');
    const body = await c.req.json();
    const { nom, prenom, dateNaissance, parentUserId } = body;

    // Get existing child data
    const existingChild = await kv.get(`children:${user.id}:${childId}`);
    
    if (!existingChild) {
      return c.json({ error: "Enfant non trouvé" }, 404);
    }

    // Get parent info if provided
    let parentName = existingChild.parentName;
    if (parentUserId !== undefined) {
      if (parentUserId) {
        const { data: parentUser } = await supabase.auth.admin.getUserById(parentUserId);
        if (parentUser?.user) {
          parentName = parentUser.user.user_metadata?.name || parentUser.user.email;
        }
      } else {
        parentName = undefined;
      }
    }

    // Update child data
    const updatedChild = {
      ...existingChild,
      nom: nom?.trim() || existingChild.nom,
      prenom: prenom?.trim() || existingChild.prenom,
      dateNaissance: dateNaissance || existingChild.dateNaissance,
      age: dateNaissance ? calculateAge(dateNaissance) : existingChild.age,
      parentUserId: parentUserId !== undefined ? (parentUserId || undefined) : existingChild.parentUserId,
      parentName: parentName,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`children:${user.id}:${childId}`, updatedChild);

    console.log('Child updated successfully:', updatedChild);
    return c.json({ 
      message: 'Enfant modifié avec succès',
      child: updatedChild 
    });
  } catch (error) {
    console.error('Error updating child:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete a child
app.delete("/make-server-3b9ea24b/children/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const childId = c.req.param('id');

    // Check if child exists
    const existingChild = await kv.get(`children:${user.id}:${childId}`);
    
    if (!existingChild) {
      return c.json({ error: "Enfant non trouvé" }, 404);
    }

    // Delete child
    await kv.del(`children:${user.id}:${childId}`);

    console.log('Child deleted successfully:', childId);
    return c.json({ 
      message: 'Enfant supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting child:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all children (for organizers/admins)
app.get("/make-server-3b9ea24b/all-children", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is organizer or admin
    const hasAccess = await hasModeratorAccess(user.id);
    if (!hasAccess) {
      console.log('[all-children] Access denied for user:', user.id, 'Role:', await getUserRole(user.id));
      return c.json({ error: "Supervisor or Admin access required" }, 403);
    }

    console.log('[all-children] Access granted for user:', user.id);

    // Get all children from all users (now returns {key, value})
    const allChildrenData = await kv.getByPrefix(`children:`);
    const allChildren = allChildrenData.map(item => item.value);
    
    // Calculate statistics
    const totalChildren = allChildren.length;
    const childrenUnder14 = allChildren.filter((child: any) => child.age < 14).length;
    const children14AndOver = allChildren.filter((child: any) => child.age >= 14).length;
    
    // Group by age ranges
    const ageRanges = {
      '0-3': allChildren.filter((child: any) => child.age >= 0 && child.age <= 3).length,
      '4-7': allChildren.filter((child: any) => child.age >= 4 && child.age <= 7).length,
      '8-11': allChildren.filter((child: any) => child.age >= 8 && child.age <= 11).length,
      '12-14': allChildren.filter((child: any) => child.age >= 12 && child.age <= 14).length,
      '15+': allChildren.filter((child: any) => child.age >= 15).length,
    };

    return c.json({ 
      children: allChildren || [],
      stats: {
        total: totalChildren,
        under14: childrenUnder14,
        from14AndOver: children14AndOver,
        ageRanges
      }
    });
  } catch (error) {
    console.error('Error fetching all children:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Delete any child
app.delete("/make-server-3b9ea24b/admin/children/:userId/:childId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: "Admin access required" }, 403);
    }

    const userId = c.req.param('userId');
    const childId = c.req.param('childId');

    // Check if child exists
    const existingChild = await kv.get(`children:${userId}:${childId}`);
    
    if (!existingChild) {
      return c.json({ error: "Enfant non trouvé" }, 404);
    }

    // Delete child
    await kv.del(`children:${userId}:${childId}`);

    console.log('[Admin] Child deleted successfully:', childId, 'by admin:', user.id);
    return c.json({ 
      message: 'Enfant supprimé avec succès'
    });
  } catch (error) {
    console.error('Error deleting child (admin):', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Create child manually
app.post("/make-server-3b9ea24b/admin/children", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: "Admin access required" }, 403);
    }

    const { userId, nom, prenom, dateNaissance } = await c.req.json();

    if (!userId || !nom || !prenom || !dateNaissance) {
      return c.json({ error: "Tous les champs sont requis" }, 400);
    }

    // Verify the target user exists
    const { data: targetUser, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !targetUser) {
      return c.json({ error: "Utilisateur non trouvé" }, 404);
    }

    // Calculate age
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Generate a unique ID for the child
    const childId = `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newChild = {
      id: childId,
      userId: userId,
      userName: targetUser.user.user_metadata?.name || `${targetUser.user.user_metadata?.firstName || ''} ${targetUser.user.user_metadata?.lastName || ''}`.trim() || targetUser.user.email,
      userEmail: targetUser.user.email,
      nom,
      prenom,
      dateNaissance,
      age,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      createdByUserId: user.id
    };

    await kv.set(`children:${userId}:${childId}`, newChild);

    console.log('[Admin] Child created manually:', childId, 'for user:', userId, 'by admin:', user.id);
    return c.json({ 
      message: 'Enfant créé avec succès',
      child: newChild
    });
  } catch (error) {
    console.error('Error creating child (admin):', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get Sainte-Barbe registration status
app.get("/make-server-3b9ea24b/events/sainte-barbe/status", async (c) => {
  try {
    const status = await kv.get('sainte_barbe_registration_status');
    
    if (!status) {
      return c.json({
        isOpen: true,
        closedMessage: ''
      });
    }
    
    return c.json(status);
  } catch (error) {
    console.error('Error fetching Sainte-Barbe status:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update Sainte-Barbe registration status
app.post("/make-server-3b9ea24b/events/sainte-barbe/status", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { isOpen, closedMessage } = await c.req.json();
    
    await kv.set('sainte_barbe_registration_status', {
      isOpen,
      closedMessage: closedMessage || ''
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating Sainte-Barbe status:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get Noel registration status
app.get("/make-server-3b9ea24b/events/noel/status", async (c) => {
  try {
    const status = await kv.get('noel_registration_status');
    
    if (!status) {
      return c.json({
        isOpen: true,
        closedMessage: ''
      });
    }
    
    return c.json(status);
  } catch (error) {
    console.error('Error fetching Noel status:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update Noel registration status
app.post("/make-server-3b9ea24b/events/noel/status", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { isOpen, closedMessage } = await c.req.json();
    
    await kv.set('noel_registration_status', {
      isOpen,
      closedMessage: closedMessage || ''
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating Noel status:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get pending users (for admin panel)
app.get("/make-server-3b9ea24b/admin/pending-users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userRole = await kv.get(`user_role:${user.id}`);
    if (userRole !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    // Get all users (not just pending)
    const allUsersData = await kv.getByPrefix('user_status:');
    const allUsers = allUsersData
      .map((item: any) => item.value)
      .filter((value: any) => value) // Filter out null values
      .map((value: any) => ({
        userId: value.userId,
        email: value.email,
        name: value.name,
        status: value.status,
        role: value.role,
        isAdmin: value.isAdmin,
        createdAt: value.createdAt
      }));

    return c.json({ users: allUsers });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all users (for admin panel)
app.get("/make-server-3b9ea24b/admin/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userRole = await kv.get(`user_role:${user.id}`);
    if (userRole !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    // Get all users from Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    // Enrich with role data from KV store
    const enrichedUsers = await Promise.all(
      users.map(async (authUser) => {
        const userStatus = await kv.get(`user_status:${authUser.id}`);
        const userRole = await kv.get(`user_role:${authUser.id}`);
        
        return {
          userId: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || 
                `${authUser.user_metadata?.firstName || ''} ${authUser.user_metadata?.lastName || ''}`.trim() || 
                authUser.email,
          status: userStatus?.status || 'approved',
          role: userRole || userStatus?.role || 'membre',
          isAdmin: userRole === 'admin',
          createdAt: authUser.created_at
        };
      })
    );

    return c.json({ users: enrichedUsers });
  } catch (error) {
    console.error('Error fetching all users:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all users (for selecting parents - accessible to approved members)
app.get("/make-server-3b9ea24b/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is approved
    const userStatus = await kv.get(`user_status:${user.id}`);
    if (userStatus?.status !== 'approved') {
      return c.json({ error: 'Account not approved' }, 403);
    }

    // Get user statuses from KV store
    const userStatuses = await kv.getByPrefix('user_status:');
    
    // Build user list from statuses
    const basicUsers = await Promise.all(
      userStatuses.map(async (item) => {
        const userId = item.key.replace('user_status:', '');
        const status = item.value;
        
        // Only include approved users
        if (status.status !== 'approved') {
          return null;
        }
        
        // Try to get user info from Supabase
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(userId);
          if (userData?.user) {
            return {
              userId: userData.user.id,
              email: userData.user.email,
              name: userData.user.user_metadata?.name || 
                    `${userData.user.user_metadata?.firstName || ''} ${userData.user.user_metadata?.lastName || ''}`.trim() || 
                    userData.user.email
            };
          }
        } catch (e) {
          console.error('Error fetching user:', userId, e);
        }
        
        return null;
      })
    );

    const filteredUsers = basicUsers.filter(u => u !== null);
    return c.json({ users: filteredUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Approve user
app.post("/make-server-3b9ea24b/admin/approve-user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userRole = await kv.get(`user_role:${user.id}`);
    if (userRole !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'userId required' }, 400);
    }

    // Update user status
    const userStatus = await kv.get(`user_status:${userId}`) || {};
    await kv.set(`user_status:${userId}`, {
      ...userStatus,
      status: 'approved'
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error approving user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Reject user
app.post("/make-server-3b9ea24b/admin/reject-user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userRole = await kv.get(`user_role:${user.id}`);
    if (userRole !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'userId required' }, 400);
    }

    // Update user status
    const userStatus = await kv.get(`user_status:${userId}`) || {};
    await kv.set(`user_status:${userId}`, {
      ...userStatus,
      status: 'rejected'
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error rejecting user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user role
app.post("/make-server-3b9ea24b/admin/update-user-role", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userRole = await kv.get(`user_role:${user.id}`);
    if (userRole !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { userId, role } = await c.req.json();
    
    console.log('[update-user-role] Received request:', { userId, role, roleType: typeof role });
    
    if (!userId || !role) {
      console.log('[update-user-role] Missing userId or role');
      return c.json({ error: 'userId and role required' }, 400);
    }

    if (!['membre', 'superviseur', 'admin'].includes(role)) {
      console.log('[update-user-role] Invalid role received:', role);
      return c.json({ error: 'Invalid role' }, 400);
    }

    console.log('[update-user-role] Role validation passed, updating...');
    
    // Update user role
    await kv.set(`user_role:${userId}`, role);
    
    // Also update in user_status if it exists
    const userStatus = await kv.get(`user_status:${userId}`);
    if (userStatus) {
      await kv.set(`user_status:${userId}`, {
        ...userStatus,
        role,
        isAdmin: role === 'admin'
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user status (approve/reject)
app.post("/make-server-3b9ea24b/admin/update-user-status", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userRole = await kv.get(`user_role:${user.id}`);
    if (userRole !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { userId, status } = await c.req.json();
    
    if (!userId || !status) {
      return c.json({ error: 'userId and status required' }, 400);
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    // Update user status
    const userStatus = await kv.get(`user_status:${userId}`) || {};
    console.log(`[update-user-status] Current status for ${userId}:`, userStatus);
    
    const updatedStatus = {
      ...userStatus,
      userId: userId, // Ensure userId is preserved
      status,
      approvedAt: status === 'approved' ? new Date().toISOString() : (userStatus.approvedAt || undefined),
      rejectedAt: status === 'rejected' ? new Date().toISOString() : (userStatus.rejectedAt || undefined)
    };
    
    await kv.set(`user_status:${userId}`, updatedStatus);
    console.log(`[update-user-status] Updated status for ${userId}:`, updatedStatus);

    return c.json({ success: true, updatedStatus });
  } catch (error) {
    console.error('Error updating user status:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Deactivate/Activate user
app.post("/make-server-3b9ea24b/admin/toggle-user-activation", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userRole = await kv.get(`user_role:${user.id}`);
    if (userRole !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { userId, isActive } = await c.req.json();
    
    if (!userId || typeof isActive !== 'boolean') {
      return c.json({ error: 'userId and isActive (boolean) required' }, 400);
    }

    // Update user status
    const userStatus = await kv.get(`user_status:${userId}`) || {};
    console.log('[Toggle User Activation] Current status:', JSON.stringify(userStatus));
    console.log('[Toggle User Activation] Setting to:', isActive ? 'approved' : 'rejected');
    
    const updatedStatus = {
      ...userStatus,
      status: isActive ? 'approved' : 'rejected',
      deactivatedAt: !isActive ? new Date().toISOString() : null,
      reactivatedAt: isActive && userStatus.status === 'rejected' ? new Date().toISOString() : userStatus.reactivatedAt
    };
    
    await kv.set(`user_status:${userId}`, updatedStatus);
    console.log('[Toggle User Activation] Updated status:', JSON.stringify(updatedStatus));
    
    // If deactivating, sign out all sessions for this user
    if (!isActive) {
      try {
        console.log('[Toggle User Activation] Signing out all sessions for user:', userId);
        await supabase.auth.admin.signOut(userId, 'global');
        console.log('[Toggle User Activation] All sessions signed out successfully');
      } catch (signOutError) {
        console.error('[Toggle User Activation] Error signing out user sessions:', signOutError);
        // Continue anyway - the KV status check will prevent login
      }
    }
    
    // Verify the update
    const verifyStatus = await kv.get(`user_status:${userId}`);
    console.log('[Toggle User Activation] Verified status after update:', JSON.stringify(verifyStatus));

    return c.json({ success: true, isActive });
  } catch (error) {
    console.error('Error toggling user activation:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete user
app.post("/make-server-3b9ea24b/admin/delete-user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    console.log('[Delete User] Received request, token present:', !!accessToken);
    if (!accessToken) {
      console.log('[Delete User] No access token provided');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    console.log('[Delete User] Auth result:', { userId: user?.id, error: authError?.message });
    if (authError || !user) {
      console.log('[Delete User] Auth failed:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const userRole = await kv.get(`user_role:${user.id}`);
    console.log('[Delete User] User role:', userRole);
    if (userRole !== 'admin') {
      console.log('[Delete User] User is not admin');
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'userId required' }, 400);
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }

    console.log('[Delete User] Starting deletion for user:', userId);

    // Delete user from Supabase Auth
    try {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error('[Delete User] Supabase Auth deletion error:', deleteError);
        throw deleteError;
      }
      console.log('[Delete User] Deleted from Supabase Auth');
    } catch (authDeleteError) {
      console.error('[Delete User] Failed to delete from Supabase Auth:', authDeleteError);
      // Continue with KV cleanup even if auth deletion fails
    }

    // Delete user data from KV store
    await kv.del(`user_status:${userId}`);
    await kv.del(`user_role:${userId}`);
    await kv.del(`require_password_change:${userId}`);
    
    // Delete user's registrations
    await kv.del(`registration_sainte_barbe:${userId}`);
    await kv.del(`registration_noel:${userId}`);
    
    // Delete user's children (get all and delete)
    const childrenData = await kv.getByPrefix(`children:${userId}:`);
    for (const item of childrenData) {
      await kv.del(item.key);
    }

    console.log('[Delete User] User data deleted successfully');

    return c.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, 500);
  }
});

// Get registration status for specific event (for admin panel)
app.get("/make-server-3b9ea24b/registration-status/:eventType", async (c) => {
  try {
    const eventType = c.req.param('eventType');
    
    if (!['sainte-barbe', 'noel'].includes(eventType)) {
      return c.json({ error: 'Invalid event type' }, 400);
    }
    
    const key = eventType === 'sainte-barbe' ? 'sainte_barbe_registration_status' : 'noel_registration_status';
    const status = await kv.get(key);
    
    if (!status) {
      return c.json({
        isOpen: true,
        closedMessage: ''
      });
    }
    
    return c.json(status);
  } catch (error) {
    console.error('Error fetching registration status:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update registration status (for admin panel)
app.post("/make-server-3b9ea24b/admin/registration-status", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { eventType, isOpen, closedMessage } = await c.req.json();
    
    if (!eventType || !['sainte-barbe', 'noel'].includes(eventType)) {
      return c.json({ error: 'Valid eventType required (sainte-barbe or noel)' }, 400);
    }
    
    const key = eventType === 'sainte-barbe' ? 'sainte_barbe_registration_status' : 'noel_registration_status';
    
    await kv.set(key, {
      isOpen: isOpen !== undefined ? isOpen : true,
      closedMessage: closedMessage || ''
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating registration status:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin: Create a new user
app.post("/make-server-3b9ea24b/admin/create-user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "No access token provided" }, 401);
    }

    const { email, password, name, role, requirePasswordChange } = await c.req.json();

    if (!email || !password || !name || !role) {
      return c.json({ error: "Email, password, name, and role are required" }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }

    if (!['membre', 'superviseur', 'admin'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    // Verify the requesting user is admin
    const { data: { user: adminUser }, error: adminError } = await supabase.auth.getUser(accessToken);

    if (adminError || !adminUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const adminStatus = await kv.get(`user_status:${adminUser.id}`);
    const adminRole = await kv.get(`user_role:${adminUser.id}`);
    if (!adminStatus?.isAdmin && adminStatus?.role !== 'admin' && adminRole !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create user in Supabase
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        firstName,
        lastName,
        phone: '',
        address: ''
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      if (createError.message.includes('already registered')) {
        return c.json({ error: "Un compte existe déjà avec cet email" }, 400);
      }
      return c.json({ error: createError.message }, 400);
    }

    if (!data.user) {
      return c.json({ error: "Erreur lors de la création du compte" }, 500);
    }

    // Create user status with approved status and assigned role
    await kv.set(`user_status:${data.user.id}`, {
      userId: data.user.id,
      status: 'approved',
      email,
      name,
      role,
      isAdmin: role === 'admin',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      createdBy: adminUser.id
    });

    // Set requirePasswordChange flag if requested
    if (requirePasswordChange) {
      console.log('[CreateUser] Setting requirePasswordChange flag for user:', data.user.id);
      await kv.set(`require_password_change:${data.user.id}`, 'true');
    } else {
      console.log('[CreateUser] requirePasswordChange not set for user:', data.user.id);
    }

    // Set user role
    await kv.set(`user_role:${data.user.id}`, role);
    
    // If admin, set approved flag
    if (role === 'admin') {
      await kv.set(`user_approved:${data.user.id}`, 'true');
    }

    return c.json({
      message: "Compte créé avec succès",
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        role,
        status: 'approved'
      }
    });
  } catch (error) {
    console.error('Unexpected error during user creation:', error);
    return c.json({ error: 'Internal server error during user creation' }, 500);
  }
});

// Reset Sainte-Barbe registrations (Admin only)
app.post("/make-server-3b9ea24b/events/sainte-barbe/reset", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('[Reset Sainte-Barbe] No access token');
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.log('[Reset Sainte-Barbe] Unauthorized user');
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id);
    console.log('[Reset Sainte-Barbe] User is admin:', isAdmin);
    
    if (!isAdmin) {
      return c.json({ error: "Admin access required" }, 403);
    }

    console.log('[Reset Sainte-Barbe] Starting reset process...');

    // Get all Sainte-Barbe registrations (now returns {key, value})
    console.log('[Reset Sainte-Barbe] Fetching registrations with prefix: registration_sainte_barbe:');
    const registrations = await kv.getByPrefix('registration_sainte_barbe:');
    console.log('[Reset Sainte-Barbe] Found registrations:', registrations.length, registrations);
    
    let deletedRegistrations = 0;
    
    // Delete using the keys returned by getByPrefix
    if (Array.isArray(registrations)) {
      for (const item of registrations) {
        try {
          console.log('[Reset Sainte-Barbe] Attempting to delete key:', item.key);
          await kv.del(item.key);
          deletedRegistrations++;
          console.log('[Reset Sainte-Barbe] Successfully deleted:', item.key);
        } catch (err) {
          console.error('[Reset Sainte-Barbe] Error deleting registration:', err);
        }
      }
    }

    // Reset all 15 tables to empty state (don't delete, reinitialize)
    console.log('[Reset Sainte-Barbe] Resetting 15 tables to empty state');
    let resetTables = 0;
    
    for (let i = 1; i <= 15; i++) {
      try {
        const tableKey = `table_sainte_barbe_${i}`;
        const emptyTable = {
          tableNumber: i,
          participants: [],
          totalSeats: 0
        };
        await kv.set(tableKey, emptyTable);
        resetTables++;
        console.log('[Reset Sainte-Barbe] Reset table', i, 'to empty state');
      } catch (err) {
        console.error('[Reset Sainte-Barbe] Error resetting table', i, ':', err);
      }
    }

    console.log(`[Reset Sainte-Barbe] Reset complete: ${deletedRegistrations} registrations deleted, ${resetTables} tables reset`);
    
    return c.json({ 
      message: `${deletedRegistrations} inscription(s) supprimée(s) et ${resetTables} table(s) réinitialisée(s) avec succès`,
      deletedRegistrations,
      resetTables
    });
  } catch (error) {
    console.error('[Reset Sainte-Barbe] Unexpected error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Reset Noël registrations (Admin only)
app.post("/make-server-3b9ea24b/events/noel/reset", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('[Reset Noël] No access token');
      return c.json({ error: "No access token provided" }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.log('[Reset Noël] Unauthorized user');
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id);
    console.log('[Reset Noël] User is admin:', isAdmin);
    
    if (!isAdmin) {
      return c.json({ error: "Admin access required" }, 403);
    }

    console.log('[Reset Noël] Starting reset process...');

    // Get all Noel registrations (now returns {key, value})
    console.log('[Reset Noël] Fetching registrations with prefix: registration_noel:');
    const registrations = await kv.getByPrefix('registration_noel:');
    console.log('[Reset Noël] Found registrations:', registrations.length, registrations);
    
    let deletedCount = 0;
    
    // Delete using the keys returned by getByPrefix
    if (Array.isArray(registrations)) {
      for (const item of registrations) {
        try {
          console.log('[Reset Noël] Attempting to delete key:', item.key);
          await kv.del(item.key);
          deletedCount++;
          console.log('[Reset Noël] Successfully deleted:', item.key);
        } catch (err) {
          console.error('[Reset Noël] Error deleting registration:', err);
        }
      }
    }

    console.log(`[Reset Noël] Reset complete: ${deletedCount} registrations deleted`);
    
    return c.json({ 
      message: `${deletedCount} inscription(s) Noël supprimée(s) avec succès`,
      deletedCount 
    });
  } catch (error) {
    console.error('[Reset Noël] Unexpected error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);