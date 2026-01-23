import { Truck, Shield, RefreshCcw, Award } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Miễn phí vận chuyển',
    description: 'Cho đơn hàng từ 2.000.000₫',
  },
  {
    icon: Shield,
    title: 'Bảo hành trọn đời',
    description: 'Chính sách bảo hành uy tín',
  },
  {
    icon: RefreshCcw,
    title: 'Đổi trả 48h',
    description: 'Đổi trả miễn phí trong 48h',
  },
  {
    icon: Award,
    title: 'Chứng nhận GIA',
    description: 'Kim cương được chứng nhận quốc tế',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-12 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
