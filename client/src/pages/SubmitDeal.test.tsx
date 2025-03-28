import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Simple form schema for testing
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function TestForm() {
  const [step, setStep] = useState(0);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });
  
  function onSubmit(data: FormValues) {
    console.log("Form submitted:", data);
  }
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {step === 0 && (
              <CardContent className="p-6">
                <h2>Step 1</h2>
                <Button type="button" onClick={() => setStep(1)}>Next</Button>
              </CardContent>
            )}
            
            {step === 1 && (
              <CardContent className="p-6">
                <h2>Step 2</h2>
                <div className="flex justify-between">
                  <Button type="button" onClick={() => setStep(0)}>Previous</Button>
                  <Button type="submit">Submit</Button>
                </div>
              </CardContent>
            )}
          </form>
        </Form>
      </Card>
    </div>
  );
}