const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to your .env

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  console.error('Required variables:');
  console.error('- REACT_APP_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function splitSqlStatements(sqlText) {
  const stmts = [];
  let buf = '';
  let inSingle = false;
  let inDouble = false;
  let inDollar = false;
  let dollarTag = '';
  for (let i = 0; i < sqlText.length; i++) {
    const ch = sqlText[i];
    const next2 = sqlText.slice(i, i + 2);
    // Enter/exit dollar-quoted string $tag$
    if (!inSingle && !inDouble) {
      // Detect start of $tag$
      if (!inDollar && ch === '$') {
        const end = sqlText.indexOf('$', i + 1);
        if (end > i) {
          const tag = sqlText.slice(i, end + 1); // like $tag$
          if (/^\$[A-Za-z0-9_]*\$/.test(tag)) {
            inDollar = true;
            dollarTag = tag;
            buf += tag;
            i = end; // jump to end of opening tag
            continue;
          }
        }
      }
      // Detect end of $tag$
      if (inDollar) {
        if (sqlText.startsWith(dollarTag, i)) {
          buf += dollarTag;
          i += dollarTag.length - 1;
          inDollar = false;
          dollarTag = '';
          continue;
        }
      }
    }

    if (!inDollar) {
      if (!inDouble && ch === "'" && sqlText[i - 1] !== '\\') {
        // toggle single-quoted literal; handle doubled quotes '' inside string by looking ahead
        if (inSingle && sqlText[i + 1] === "'") {
          // escaped single-quote inside string
          buf += "''";
          i += 1;
          continue;
        }
        inSingle = !inSingle;
      } else if (!inSingle && ch === '"' && sqlText[i - 1] !== '\\') {
        inDouble = !inDouble;
      }
    }

    if (!inSingle && !inDouble && !inDollar && ch === ';') {
      const stmt = buf.trim();
      if (stmt && !stmt.startsWith('--')) stmts.push(stmt);
      buf = '';
      continue;
    }
    buf += ch;
  }
  const tail = buf.trim();
  if (tail) stmts.push(tail);
  return stmts;
}

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = splitSqlStatements(sql);
  console.log(`Executing ${statements.length} statements from ${path.basename(filePath)}...`);
  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.warn(`Warning executing statement: ${error.message}`);
      }
    } catch (err) {
      console.warn(`Warning: ${err.message}`);
    }
  }
}

async function setupDatabase() {
  try {
    console.log('Setting up Supabase database...');

    // Execute core schema and add-ons
    const baseDir = path.join(__dirname, '..', 'database');
    const files = [
      'schema.sql',
      'create-grade-sections-table.sql',
      'create-section-subjects-table.sql',
      'compat-sections-view.sql',
      'mobile-views.sql',
      'rls_policies_all.sql',
    ];

    for (const f of files) {
      const full = path.join(baseDir, f);
      if (fs.existsSync(full)) {
        await runSqlFile(full);
      } else {
        console.warn(`Skipped missing SQL file: ${f}`);
      }
    }

    console.log('Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Create your first admin user by signing up through the app');
    console.log('2. Update the user role to "Admin" in the Supabase dashboard');
    console.log('3. Start using the application!');

  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Alternative setup using direct SQL execution
async function setupDatabaseDirect() {
  try {
    console.log('Setting up Supabase database (direct method)...');
    
    // Create a function to execute SQL
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (functionError) {
      console.warn('Function creation warning:', functionError.message);
    }

    // Execute the schema
    await setupDatabase();

  } catch (error) {
    console.error('Error in direct setup:', error);
    console.log('\nManual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of database/schema.sql');
    console.log('4. Execute the SQL');
  }
}

// Run the setup
if (require.main === module) {
  setupDatabaseDirect();
}

module.exports = { setupDatabase, setupDatabaseDirect };
