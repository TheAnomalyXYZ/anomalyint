function Heading() {
  return (
    <div className="absolute h-[28px] left-[24px] top-[24px] w-[572.5px]" data-name="Heading 2">
      <p className="absolute css-ew64yg font-['Outfit:SemiBold',sans-serif] font-semibold leading-[28px] left-0 text-[#1a1a2e] text-[20px] top-[0.5px]">Recent Campaigns</p>
    </div>
  );
}

function HeaderCell() {
  return (
    <div className="absolute h-[40.5px] left-0 top-0 w-[160.977px]" data-name="Header Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[16px] left-[8px] text-[#6b7280] text-[12px] top-[12.5px] uppercase">Name</p>
    </div>
  );
}

function HeaderCell1() {
  return (
    <div className="absolute h-[40.5px] left-[160.98px] top-0 w-[124.195px]" data-name="Header Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[16px] left-[8px] text-[#6b7280] text-[12px] top-[12.5px] uppercase">Game</p>
    </div>
  );
}

function HeaderCell2() {
  return (
    <div className="absolute h-[40.5px] left-[285.17px] top-0 w-[115.781px]" data-name="Header Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[16px] left-[8px] text-[#6b7280] text-[12px] top-[12.5px] uppercase">Status</p>
    </div>
  );
}

function HeaderCell3() {
  return (
    <div className="absolute h-[40.5px] left-[400.95px] top-0 w-[83.281px]" data-name="Header Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[16px] left-[75.6px] text-[#6b7280] text-[12px] text-right top-[12.5px] translate-x-[-100%] uppercase">Revenue</p>
    </div>
  );
}

function HeaderCell4() {
  return (
    <div className="absolute h-[40.5px] left-[484.23px] top-0 w-[115.766px]" data-name="Header Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[16px] left-[107.93px] text-[#6b7280] text-[12px] text-right top-[12.5px] translate-x-[-100%] uppercase">Participants</p>
    </div>
  );
}

function TableRow() {
  return (
    <div className="absolute border-[#e5e7eb] border-b border-solid h-[40.5px] left-0 top-0 w-[600px]" data-name="Table Row">
      <HeaderCell />
      <HeaderCell1 />
      <HeaderCell2 />
      <HeaderCell3 />
      <HeaderCell4 />
    </div>
  );
}

function TableHeader() {
  return (
    <div className="absolute h-[40.5px] left-0 top-0 w-[600px]" data-name="Table Header">
      <TableRow />
    </div>
  );
}

function TableCell() {
  return (
    <div className="absolute h-[51.5px] left-0 top-0 w-[160.977px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[20px] left-[8px] text-[#1a1a2e] text-[14px] top-[15.75px]">Season 2 Launch</p>
    </div>
  );
}

function TableCell1() {
  return (
    <div className="absolute h-[51.5px] left-[160.98px] top-0 w-[124.195px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Regular',sans-serif] font-normal leading-[20px] left-[8px] text-[#6b7280] text-[14px] top-[15.75px]">Neura Knights</p>
    </div>
  );
}

function Text() {
  return (
    <div className="absolute bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] border-solid h-[26px] left-[8px] rounded-[16777200px] top-[13px] w-[55.523px]" data-name="Text">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[16px] left-[10px] text-[#22c55e] text-[12px] top-[4.5px]">Active</p>
    </div>
  );
}

function TableCell2() {
  return (
    <div className="absolute h-[51.5px] left-[285.17px] top-0 w-[115.781px]" data-name="Table Cell">
      <Text />
    </div>
  );
}

function TableCell3() {
  return (
    <div className="absolute h-[51.5px] left-[400.95px] top-0 w-[83.281px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[20px] left-[76.09px] text-[#1a1a2e] text-[14px] text-right top-[15.75px] translate-x-[-100%]">$42,350</p>
    </div>
  );
}

function TableCell4() {
  return (
    <div className="absolute h-[51.5px] left-[484.23px] top-0 w-[115.766px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Regular',sans-serif] font-normal leading-[20px] left-[108.47px] text-[#6b7280] text-[14px] text-right top-[15.75px] translate-x-[-100%]">1,247</p>
    </div>
  );
}

function TableRow1() {
  return (
    <div className="absolute border-[#e5e7eb] border-b border-solid h-[51.5px] left-0 top-0 w-[600px]" data-name="Table Row">
      <TableCell />
      <TableCell1 />
      <TableCell2 />
      <TableCell3 />
      <TableCell4 />
    </div>
  );
}

function TableCell5() {
  return (
    <div className="absolute h-[51.5px] left-0 top-0 w-[160.977px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[20px] left-[8px] text-[#1a1a2e] text-[14px] top-[15.75px]">New Player Bonus</p>
    </div>
  );
}

function TableCell6() {
  return (
    <div className="absolute h-[51.5px] left-[160.98px] top-0 w-[124.195px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Regular',sans-serif] font-normal leading-[20px] left-[8px] text-[#6b7280] text-[14px] top-[15.75px]">Goonville</p>
    </div>
  );
}

function Text1() {
  return (
    <div className="absolute bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] border-solid h-[26px] left-[8px] rounded-[16777200px] top-[13px] w-[55.523px]" data-name="Text">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[16px] left-[10px] text-[#22c55e] text-[12px] top-[4.5px]">Active</p>
    </div>
  );
}

function TableCell7() {
  return (
    <div className="absolute h-[51.5px] left-[285.17px] top-0 w-[115.781px]" data-name="Table Cell">
      <Text1 />
    </div>
  );
}

function TableCell8() {
  return (
    <div className="absolute h-[51.5px] left-[400.95px] top-0 w-[83.281px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[20px] left-[76.16px] text-[#1a1a2e] text-[14px] text-right top-[15.75px] translate-x-[-100%]">$28,920</p>
    </div>
  );
}

function TableCell9() {
  return (
    <div className="absolute h-[51.5px] left-[484.23px] top-0 w-[115.766px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Regular',sans-serif] font-normal leading-[20px] left-[107.93px] text-[#6b7280] text-[14px] text-right top-[15.75px] translate-x-[-100%]">892</p>
    </div>
  );
}

function TableRow2() {
  return (
    <div className="absolute border-[#e5e7eb] border-b border-solid h-[51.5px] left-0 top-[51.5px] w-[600px]" data-name="Table Row">
      <TableCell5 />
      <TableCell6 />
      <TableCell7 />
      <TableCell8 />
      <TableCell9 />
    </div>
  );
}

function TableCell10() {
  return (
    <div className="absolute h-[51.5px] left-0 top-0 w-[160.977px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[20px] left-[8px] text-[#1a1a2e] text-[14px] top-[15.75px]">Weekend Event</p>
    </div>
  );
}

function TableCell11() {
  return (
    <div className="absolute h-[51.5px] left-[160.98px] top-0 w-[124.195px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Regular',sans-serif] font-normal leading-[20px] left-[8px] text-[#6b7280] text-[14px] top-[15.75px]">GMeow</p>
    </div>
  );
}

function Text2() {
  return (
    <div className="absolute bg-[rgba(106,114,130,0.1)] border border-[rgba(106,114,130,0.2)] border-solid h-[26px] left-[8px] rounded-[16777200px] top-[13px] w-[80.867px]" data-name="Text">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[16px] left-[10px] text-[#99a1af] text-[12px] top-[4.5px]">Completed</p>
    </div>
  );
}

function TableCell12() {
  return (
    <div className="absolute h-[51.5px] left-[285.17px] top-0 w-[115.781px]" data-name="Table Cell">
      <Text2 />
    </div>
  );
}

function TableCell13() {
  return (
    <div className="absolute h-[51.5px] left-[400.95px] top-0 w-[83.281px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[20px] left-[75.66px] text-[#1a1a2e] text-[14px] text-right top-[15.75px] translate-x-[-100%]">$15,680</p>
    </div>
  );
}

function TableCell14() {
  return (
    <div className="absolute h-[51.5px] left-[484.23px] top-0 w-[115.766px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Regular',sans-serif] font-normal leading-[20px] left-[108.29px] text-[#6b7280] text-[14px] text-right top-[15.75px] translate-x-[-100%]">543</p>
    </div>
  );
}

function TableRow3() {
  return (
    <div className="absolute border-[#e5e7eb] border-b border-solid h-[51.5px] left-0 top-[103px] w-[600px]" data-name="Table Row">
      <TableCell10 />
      <TableCell11 />
      <TableCell12 />
      <TableCell13 />
      <TableCell14 />
    </div>
  );
}

function TableCell15() {
  return (
    <div className="absolute h-[51.5px] left-0 top-0 w-[160.977px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[20px] left-[8px] text-[#1a1a2e] text-[14px] top-[15.75px]">Referral Campaign</p>
    </div>
  );
}

function TableCell16() {
  return (
    <div className="absolute h-[51.5px] left-[160.98px] top-0 w-[124.195px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Regular',sans-serif] font-normal leading-[20px] left-[8px] text-[#6b7280] text-[14px] top-[15.75px]">Vectra</p>
    </div>
  );
}

function Text3() {
  return (
    <div className="absolute bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] border-solid h-[26px] left-[8px] rounded-[16777200px] top-[13px] w-[55.523px]" data-name="Text">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[16px] left-[10px] text-[#22c55e] text-[12px] top-[4.5px]">Active</p>
    </div>
  );
}

function TableCell17() {
  return (
    <div className="absolute h-[51.5px] left-[285.17px] top-0 w-[115.781px]" data-name="Table Cell">
      <Text3 />
    </div>
  );
}

function TableCell18() {
  return (
    <div className="absolute h-[51.5px] left-[400.95px] top-0 w-[83.281px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[20px] left-[75.58px] text-[#1a1a2e] text-[14px] text-right top-[15.75px] translate-x-[-100%]">$31,240</p>
    </div>
  );
}

function TableCell19() {
  return (
    <div className="absolute h-[51.5px] left-[484.23px] top-0 w-[115.766px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Regular',sans-serif] font-normal leading-[20px] left-[108.59px] text-[#6b7280] text-[14px] text-right top-[15.75px] translate-x-[-100%]">678</p>
    </div>
  );
}

function TableRow4() {
  return (
    <div className="absolute border-[#e5e7eb] border-b border-solid h-[51.5px] left-0 top-[154.5px] w-[600px]" data-name="Table Row">
      <TableCell15 />
      <TableCell16 />
      <TableCell17 />
      <TableCell18 />
      <TableCell19 />
    </div>
  );
}

function TableCell20() {
  return (
    <div className="absolute h-[51.5px] left-0 top-0 w-[160.977px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[20px] left-[8px] text-[#1a1a2e] text-[14px] top-[15.75px]">Beta Test</p>
    </div>
  );
}

function TableCell21() {
  return (
    <div className="absolute h-[51.5px] left-[160.98px] top-0 w-[124.195px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Regular',sans-serif] font-normal leading-[20px] left-[8px] text-[#6b7280] text-[14px] top-[15.75px]">Synapse</p>
    </div>
  );
}

function Text4() {
  return (
    <div className="absolute bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] border-solid h-[26px] left-[8px] rounded-[16777200px] top-[13px] w-[60.656px]" data-name="Text">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[16px] left-[10px] text-[#f59e0b] text-[12px] top-[4.5px]">Paused</p>
    </div>
  );
}

function TableCell22() {
  return (
    <div className="absolute h-[51.5px] left-[285.17px] top-0 w-[115.781px]" data-name="Table Cell">
      <Text4 />
    </div>
  );
}

function TableCell23() {
  return (
    <div className="absolute h-[51.5px] left-[400.95px] top-0 w-[83.281px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Medium',sans-serif] font-medium leading-[20px] left-[75.94px] text-[#1a1a2e] text-[14px] text-right top-[15.75px] translate-x-[-100%]">$8,450</p>
    </div>
  );
}

function TableCell24() {
  return (
    <div className="absolute h-[51.5px] left-[484.23px] top-0 w-[115.766px]" data-name="Table Cell">
      <p className="absolute css-ew64yg font-['Outfit:Regular',sans-serif] font-normal leading-[20px] left-[108.3px] text-[#6b7280] text-[14px] text-right top-[15.75px] translate-x-[-100%]">234</p>
    </div>
  );
}

function TableRow5() {
  return (
    <div className="absolute border-[#e5e7eb] border-b border-solid h-[51.5px] left-0 top-[206px] w-[600px]" data-name="Table Row">
      <TableCell20 />
      <TableCell21 />
      <TableCell22 />
      <TableCell23 />
      <TableCell24 />
    </div>
  );
}

function TableBody() {
  return (
    <div className="absolute h-[257.5px] left-0 top-[40.5px] w-[600px]" data-name="Table Body">
      <TableRow1 />
      <TableRow2 />
      <TableRow3 />
      <TableRow4 />
      <TableRow5 />
    </div>
  );
}

function Table() {
  return (
    <div className="h-[298.5px] relative shrink-0 w-full" data-name="Table">
      <TableHeader />
      <TableBody />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex flex-col h-[298.5px] items-start left-0 overflow-clip pl-[24px] pr-[-3.5px] top-[68px] w-[620.5px]" data-name="Container">
      <Table />
    </div>
  );
}

export default function RecentCampaigns() {
  return (
    <div className="bg-white border border-[#e5e7eb] border-solid relative rounded-[24px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.05)] size-full" data-name="RecentCampaigns">
      <Heading />
      <Container />
    </div>
  );
}