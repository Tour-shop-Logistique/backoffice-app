import React, { useState } from "react";
import { Globe, MapPin } from "lucide-react";
import ZoneConfiguration from "./ZoneConfiguration";
import CommuneConfiguration from "./CommuneConfiguration";
import Tabs from "../components/common/Tabs";

const ZonesEtCommunes = () => {
  const [activeTab, setActiveTab] = useState("zones");

  return (
    <div className="space-y-4 pb-6 md:space-y-6 md:pb-12">
      <div className="sticky top-[-24px] md:top-[-32px] z-40 bg-[#f1f5f9] -mx-6 px-6 md:-mx-8 md:px-8 pt-4 lg:pt-2 pb-3">
        <Tabs
          tabs={[
            { id: "zones", label: "Zones d'expéditions", icon: Globe },
            { id: "communes", label: "Communes", icon: MapPin },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === "zones" && <ZoneConfiguration />}
      {activeTab === "communes" && <CommuneConfiguration />}
    </div>
  );
};

export default ZonesEtCommunes;
