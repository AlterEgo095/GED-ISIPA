const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function seed() {
  const prisma = new PrismaClient();
  try {
    console.log('Creating ISIPA organization...');
    const org = await prisma.organization.create({
      data: {
        name: 'ISIPA', slug: 'isipa', code: 'ISIPA',
        type: 'INSTITUTION', status: 'ACTIVE', plan: 'ENTERPRISE',
        primaryColor: '#0d9488',
        settings: JSON.stringify({modules:['documents','workflows','audit','archives'],defaultLanguage:'fr',timezone:'Africa/Kinshasa'}),
        maxUsers: 100, maxStorage: 10737418240,
      }
    });
    console.log('Org created:', org.id);

    const adminPass = await bcrypt.hash('Admin@2025!', 12);
    const managerPass = await bcrypt.hash('Manager@2025!', 12);
    const userPass = await bcrypt.hash('User@2025!', 12);

    const admin = await prisma.user.create({data:{email:'admin@isipa.cd',name:'Administrateur ISIPA',password:adminPass,role:'SUPER_ADMIN',organizationId:org.id,isActive:true}});
    console.log('Admin:', admin.email);
    
    const orgAdmin = await prisma.user.create({data:{email:'direction@isipa.cd',name:'Direction ISIPA',password:managerPass,role:'ORG_ADMIN',organizationId:org.id,isActive:true}});
    const regularUser = await prisma.user.create({data:{email:'agent@isipa.cd',name:'Agent ISIPA',password:userPass,role:'USER',organizationId:org.id,isActive:true}});
    console.log('Users created');

    const deptSG = await prisma.department.create({data:{name:'Secretariat General',code:'SG',description:'Secretariat General',organizationId:org.id}});
    const deptDAF = await prisma.department.create({data:{name:'Direction Admin et Financiere',code:'DAF',description:'DAF',organizationId:org.id}});
    const deptDRH = await prisma.department.create({data:{name:'Direction RH',code:'DRH',description:'DRH',organizationId:org.id}});
    const deptAcad = await prisma.department.create({data:{name:'Direction Academique',code:'DAC',description:'Academic',organizationId:org.id}});
    console.log('Departments created');

    await prisma.user.update({where:{id:orgAdmin.id},data:{departmentId:deptSG.id}});
    await prisma.user.update({where:{id:regularUser.id},data:{departmentId:deptDAF.id}});

    const wf = await prisma.workflow.create({data:{name:'Approbation Document',description:'Workflow standard',organizationId:org.id,type:'DOCUMENT_APPROVAL'}});
    const s1 = await prisma.workflowState.create({data:{name:'Brouillon',color:'#6b7280',order:1,workflowId:wf.id,organizationId:org.id}});
    const s2 = await prisma.workflowState.create({data:{name:'En Revision',color:'#f59e0b',order:2,workflowId:wf.id,organizationId:org.id}});
    const s3 = await prisma.workflowState.create({data:{name:'Approuve',color:'#10b981',order:3,workflowId:wf.id,organizationId:org.id}});
    const s4 = await prisma.workflowState.create({data:{name:'Publie',color:'#3b82f6',order:4,workflowId:wf.id,organizationId:org.id}});
    
    await prisma.workflowTransition.createMany({data:[
      {fromStateId:s1.id,toStateId:s2.id,action:'submit',workflowId:wf.id,organizationId:org.id,requiredRole:'USER'},
      {fromStateId:s2.id,toStateId:s3.id,action:'approve',workflowId:wf.id,organizationId:org.id,requiredRole:'ORG_ADMIN'},
      {fromStateId:s2.id,toStateId:s1.id,action:'reject',workflowId:wf.id,organizationId:org.id,requiredRole:'ORG_ADMIN'},
      {fromStateId:s3.id,toStateId:s4.id,action:'publish',workflowId:wf.id,organizationId:org.id,requiredRole:'SUPER_ADMIN'},
    ]});
    console.log('Workflow created');

    await prisma.organizationModule.createMany({data:[
      {organizationId:org.id,moduleId:'documents',enabled:true},
      {organizationId:org.id,moduleId:'workflows',enabled:true},
      {organizationId:org.id,moduleId:'audit',enabled:true},
      {organizationId:org.id,moduleId:'archives',enabled:true},
      {organizationId:org.id,moduleId:'departments',enabled:true},
      {organizationId:org.id,moduleId:'notifications',enabled:true},
    ]});
    
    await prisma.systemSetting.createMany({data:[
      {key:'platform_name',value:'GED-ISIPA'},
      {key:'platform_version',value:'1.0.0'},
      {key:'default_language',value:'fr'},
    ]});
    
    console.log('\nSEED COMPLETE');
    console.log('admin@isipa.cd / Admin@2025!');
    console.log('direction@isipa.cd / Manager@2025!');
    console.log('agent@isipa.cd / User@2025!');
  } catch(e) {
    console.error('SEED ERROR:', e.message);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}
seed().catch(e=>{console.error(e);process.exit(1);});
